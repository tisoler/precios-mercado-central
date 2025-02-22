import { NextResponse } from 'next/server';
// import obtenerUltimosPrecios from '../../lib/descarga';
import descargarLote from '@/app/lib/descargaLote';

export async function GET() {

  try { 
    await descargarLote();
    return NextResponse.json({ message: 'Descarga exitosa' });
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : String(error);
    console.log('Error en descarga: ' + errorMessage);
    return NextResponse.json({ error: errorMessage }, { status: 500 });
  }
}
