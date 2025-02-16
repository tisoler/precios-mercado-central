import AdmZip, { IZipEntry } from 'adm-zip';
import axios from 'axios';
import fs from 'fs';
import path from 'path';
import * as XLSX from 'xlsx';

export type Archivo = {
  archivo: string;
  data: unknown[];
};

async function downloadAndExtractFile(fileUrl: string, category: string): Promise<Archivo> {
  const response = await axios.get(fileUrl, { responseType: 'arraybuffer' });

  // Guardar el archivo ZIP
  const zipPath = path.join(process.cwd(), 'public', fileUrl?.split('/').pop() || 'SinNombre');
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
    const data = XLSX.utils.sheet_to_json(sheet); // Convertir a JSON

    // Eliminar archivos zip
    fs.unlinkSync(zipPath);

    return {
      archivo: latestXlsEntry.entryName,
      data,
    };
  } catch (error) {
    // Eliminar archivos zip
    try { fs.unlinkSync(zipPath); } catch {}
    throw error;
  }
}

export default downloadAndExtractFile;
