import AdmZip, { IZipEntry } from 'adm-zip';
import axios from 'axios';
import * as cheerio from 'cheerio';
import fs from 'fs';
import path from 'path';
import * as XLSX from 'xlsx';
import { Precio } from '../modelos/precio';

export type Archivo = {
  archivo: string;
  data: unknown[];
};

const URL_MERCADO = 'https://mercadocentral.gob.ar/informaci%C3%B3n/precios-mayoristas';

async function descargarUltimosPrecios() {
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
  await descargarYExtraerArchivo(lastFrutaFile, 'fruta');
  await descargarYExtraerArchivo(lastHortalizaFile, 'hortaliza');

}

async function descargarYExtraerArchivo(fileUrl: string, category: string) {
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

    // Leer el archivo XLS
    const workbook = XLSX.read(latestXlsEntry.getData(), { type: 'buffer' });
    const sheetName = workbook.SheetNames[0]; // Obtener la primera hoja
    const sheet = workbook.Sheets[sheetName];
    let data = XLSX.utils.sheet_to_json(sheet); // Convertir a JSON

    // Verificar si ya existen los datos del archivo
    const baseUrl = process.env.NEXT_PUBLIC_BASE_API_URL || 'http://localhost:3049';
    const respPrecios = await axios.get(`${baseUrl}/api/precio`);
    const preciosExistentes = respPrecios?.data ? respPrecios.data as Precio[] : [];

    // Si ya están cargados para esa fecha no guardo nada
    if (preciosExistentes?.some(p => p.archivo === latestXlsEntry.entryName)) {
      // Eliminar archivos zip
      fs.unlinkSync(zipPath);
      return;
    }

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
        } as unknown as Precio;
      });
    }

    // Eliminar archivos zip
    fs.unlinkSync(zipPath);

    // Guardar precios
    await axios.post('http://localhost:3000/api/precio', precios);

  } catch (error) {
    // Eliminar archivos zip
    console.log('Error: ' + error)
    try { fs.unlinkSync(zipPath); } catch {}
    throw error;
  }
}

export default descargarUltimosPrecios;
