import { NextResponse } from 'next/server';
import axios from 'axios';
import downloadAndExtractFile from '../../lib/descarga';
import * as cheerio from 'cheerio';

export async function GET() {
  const url = 'https://mercadocentral.gob.ar/informaci%C3%B3n/precios-mayoristas';

  try {
    // Obtener el contenido de la página
    const response = await axios.get(url);
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
    const frutaXls = await downloadAndExtractFile(lastFrutaFile, 'fruta');
    const hortalizaXls = await downloadAndExtractFile(lastHortalizaFile, 'hortaliza');

    // Devolver los nombres de los archivos
    return NextResponse.json({
      archivoFruta: frutaXls,
      archivoHortaliza: hortalizaXls,
    });
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : String(error);
    console.log('Error en descarga: ' + errorMessage);
    return NextResponse.json({ error: errorMessage }, { status: 500 });
  }
}
