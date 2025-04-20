import AdmZip, { IZipEntry } from 'adm-zip';
import axios from 'axios';
import * as cheerio from 'cheerio';
import fs from 'fs';
import path from 'path';
import * as XLSX from 'xlsx';
import { initPrecio, Precio } from '../modelos/precio';
import { Op } from 'sequelize';

export type Archivo = {
  archivo: string;
  data: unknown[];
};

const URL_MERCADO = 'https://mercadocentral.gob.ar/informaci%C3%B3n/precios-mayoristas';

const obtenerUltimosPrecios = async (): Promise<Precio[]> => {
  // Obtener últimos precios de la base
  // Si los últimos precios son del día hábil anterior, no descarga nada y devuelve los últimos
  // Día hábil anterior: luenes a viernes
  await initPrecio();
  const ultimosPrecioCargado = await Precio.findOne({
    attributes: ['archivo', 'fecha'],
    order: [['fecha', 'DESC']]
  }) || null;

  if (ultimosPrecioCargado) {
    // Obtener último día hábil anterior a hoy
    const hoy = new Date();
    const fechaHoy = hoy.toLocaleDateString('es-AR', { day: '2-digit', month: '2-digit', year: '2-digit' }).replace(/\//g, '');
    const ayer = new Date();
    ayer.setDate(hoy.getDate() - 1);
    const fechaAyer = ayer.toLocaleDateString('es-AR', { day: '2-digit', month: '2-digit', year: '2-digit' }).replace(/\//g, '');
    const ultimoArchivo = ultimosPrecioCargado.archivo;
    // Si es domingo no descarga nada y devuelve los últimos precios
    // Si el día anterior fue hábil y los últimos precios son de esa fecha o de hoy, devolverlos y no descargar nada
    if (hoy.getDay() === 0 || ultimoArchivo.includes(fechaAyer) || ultimoArchivo.includes(fechaHoy)) {
      return await Precio.findAll({
        where: {
          fecha: {
            [Op.eq]: ultimosPrecioCargado.fecha
          }
        }
      }) || [];
    }
  }

  // DESCARGA PRECIOS DE LA PÁGINA DEL MERCADO
  // Obtener el contenido de la página
  const response = await axios.get(URL_MERCADO);
  const $ = cheerio.load(response.data);

  // Extraer todos los enlaces que terminan en .zip
  const zipLinks: string[] = [];
  $('a[href$=".zip"]').each((_, element) => {
    const href = $(element).attr('href');
    if (href) {
      zipLinks.push(href);
    }
  });

  // Filtrar los archivos que contienen "FRUTA" o "HORTALIZA"
  const frutaFiles = zipLinks.filter(link => link.includes('FRUTA'));
  const hortalizaFiles = zipLinks.filter(link => link.includes('HORTALIZA'));

  // Obtener el último archivo para cada categoría
  const lastFrutaFile = frutaFiles.pop();
  const lastHortalizaFile = hortalizaFiles.pop();

  if (!lastFrutaFile || !lastHortalizaFile) {
    throw new Error('No se encontraron archivos válidos');
  }

  // Descargar y procesar los archivos
  const ultimosPreciosFrutas = await descargarYExtraerArchivo(lastFrutaFile, 'fruta');
  const ultimosPreciosHortalizas = await descargarYExtraerArchivo(lastHortalizaFile, 'hortaliza');

  return [...ultimosPreciosFrutas, ...ultimosPreciosHortalizas];
}

async function descargarYExtraerArchivo(fileUrl: string, category: string): Promise<Precio[]> {
  const response = await axios.get(fileUrl, { responseType: 'arraybuffer' });

  // Guardar el archivo ZIP
  const nombreArchivoZip = fileUrl?.split('/').pop() || 'SinNombre';
  const zipPath = path.join(process.cwd(), 'public', nombreArchivoZip);
  fs.writeFileSync(zipPath, response.data);
  try {
    // Extraer el archivo XLS
    const zip = new AdmZip(response.data);
    const zipEntries = zip.getEntries();

    // Buscar el archivo XLS más reciente
    let latestXlsEntry: IZipEntry | null = null;
    for (const entry of zipEntries) {
      if (entry.entryName?.toLowerCase()?.endsWith('.xls') && (!latestXlsEntry || entry.entryName > latestXlsEntry.entryName)) {
        latestXlsEntry = entry;
      }
    };

    if (!latestXlsEntry) {
      throw new Error(`No se encontró un archivo XLS en el ZIP de ${category}`);
    }

    // Verificar si ya existen los datos del archivo
    await initPrecio(); // Usado tambien para el bulkCreate luego
    const utlimosPrecios = await Precio.findAll({
      where: {
        archivo: latestXlsEntry.entryName,
        fecha: {
          [Op.eq]: await Precio.findOne({
            attributes: ['fecha'],
            order: [['fecha', 'DESC']]
          }).then(result => result?.fecha)
        }
      },
      raw: true
    }) || [];

    // Si ya están cargados para esa fecha no guardo nada
    if (utlimosPrecios?.some(p => p.archivo === latestXlsEntry.entryName)) {
      // Eliminar archivos zip
      fs.unlinkSync(zipPath);
      return utlimosPrecios;
    }

    // Leer el archivo XLS
    const workbook = XLSX.read(latestXlsEntry.getData(), { type: 'buffer' });
    const sheetName = workbook.SheetNames[0]; // Obtener la primera hoja
    const sheet = workbook.Sheets[sheetName];
    let data = XLSX.utils.sheet_to_json(sheet); // Convertir a JSON

    // Filtrar columnas, mantener solamente ESP, MA, MAPK, ENV, KG, CAL, PROC, VAR
    const columnaMA = 'MA' + latestXlsEntry.entryName.replace('RF', '').replace('RH', '').replace('.XLS', '');
    const columnsToKeep = ['ESP', columnaMA, 'MAPK', 'ENV', 'KG', 'TAM', 'CAL', 'PROC', 'VAR'];
    const filteredData = data.map(row => {
      const newRow: Record<string, unknown> = {};
      for (const col of columnsToKeep) {
        if (col in (row as Record<string, unknown>)) {
          newRow[col] = (row as Record<string, unknown>)[col];
        }
      }
      return newRow;
    });
    data = filteredData;
    
    let precios: Precio[] = [];
    if (data?.length > 0) {
      precios = data.map(p => {
        const item = p as Record<string, unknown>;
        return {
          esp: item['ESP'],
          ma: item[columnaMA],
          mapk: item['MAPK'],
          env: item['ENV'],
          kg: item['KG'],
          cal: item['CAL'],
          tam: item['TAM'],
          proc: item['PROC'],
          var: item['VAR'],
          archivo: latestXlsEntry.entryName,
          fecha: new Date().toISOString().slice(0, 10).replace(/-/g, ''),
        } as Precio;
      });
    }

    // Eliminar archivos zip
    fs.unlinkSync(zipPath);

    // Guardar precios
    await Precio.bulkCreate(precios);
    return precios;

  } catch (error) {
    // Eliminar archivos zip
    console.log('Error: ' + error)
    try {
      fs.unlinkSync(zipPath);
      return [];
    } catch {}
    throw error;
  }
}

export default obtenerUltimosPrecios;
