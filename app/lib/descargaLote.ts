import AdmZip from 'adm-zip';
import axios from 'axios';
import * as cheerio from 'cheerio';
import fs from 'fs';
import path from 'path';
import * as XLSX from 'xlsx';
import { initPrecio, Precio } from '../modelos/precio';

export type Archivo = {
  archivo: string;
  data: unknown[];
};

const URL_MERCADO = 'https://mercadocentral.gob.ar/informaci%C3%B3n/precios-mayoristas';

const descargarLote = async () => {
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
  const frutaFiles = zipLinks.filter(link => link.includes('FRUTAS-ENERO-24'));
  const hortalizaFiles = zipLinks.filter(link => link.includes('HORTALIZAS-ENERO-24'));

  // Obtener el último archivo para cada categoría
  const lastFrutaFile = frutaFiles.pop();
  const lastHortalizaFile = hortalizaFiles.pop();

  if (!lastFrutaFile || !lastHortalizaFile) {
    throw new Error('No se encontraron archivos válidos');
  }

  // Descargar y procesar los archivos
  //await descargarYExtraerArchivoLote(lastFrutaFile);
  //await descargarYExtraerArchivoLote(lastHortalizaFile);
}

async function descargarYExtraerArchivoLote(fileUrl: string) {
  const response = await axios.get(fileUrl, { responseType: 'arraybuffer' });

  // Guardar el archivo ZIP
  const nombreArchivoZip = fileUrl?.split('/').pop() || 'SinNombre';
  const zipPath = path.join(process.cwd(), 'public', nombreArchivoZip);
  fs.writeFileSync(zipPath, response.data);

  try {
    // Extraer el archivo XLS
    const zip = new AdmZip(response.data);
    const zipEntries = zip.getEntries();

    for (const entry of zipEntries) {
      if (entry.entryName?.toLowerCase()?.endsWith('.xls')) {
        // Leer el archivo XLS
        const workbook = XLSX.read(entry.getData(), { type: 'buffer' });
        const sheetName = workbook.SheetNames[0]; // Obtener la primera hoja
        const sheet = workbook.Sheets[sheetName];
        let data = XLSX.utils.sheet_to_json(sheet); // Convertir a JSON

        // Filtrar columnas, mantener solamente ESP, MA, MAPK, ENV, KG, CAL, PROC, VAR
        const columnaMA = 'MA' + entry.entryName.replace('RF', '').replace('RH', '').replace('.XLS', '');
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
              archivo: entry.entryName,
              fecha: `2024${entry.entryName[4]}${entry.entryName[5]}${entry.entryName[2]}${entry.entryName[3]}`,
            } as Precio;
          });
        }

        // Guardar precios
        await initPrecio();
        await Precio.bulkCreate(precios);
      }
    };
    // Eliminar archivos zip
    fs.unlinkSync(zipPath);
  } catch (error) {
    // Eliminar archivos zip
    console.log('Error: ' + error)
    try {
      fs.unlinkSync(zipPath);
    } catch {}
    throw error;
  }
}

export default descargarLote;
