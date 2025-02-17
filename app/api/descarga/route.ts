import { NextResponse } from 'next/server';
import descargarUltimosPrecios from '../../lib/descarga';

export async function GET() {

  try { 
    await descargarUltimosPrecios();
    return NextResponse.json({ message: 'Descarga exitosa' });
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : String(error);
    console.log('Error en descarga: ' + errorMessage);
    return NextResponse.json({ error: errorMessage }, { status: 500 });
  }
}
