import { NextRequest, NextResponse } from 'next/server';
import obtenerUltimosPrecios from '../../../lib/descarga';

export async function GET(request: NextRequest) {
  try {
    if (request.method === 'GET') {
      const ultimosPrecios = await obtenerUltimosPrecios();
      return NextResponse.json(ultimosPrecios);
    } else {
      return NextResponse.json({ message: 'Método no permitido' }, { status: 405 });
    }
  } catch (error) {
    return NextResponse.json({ message: 'Error recuperando últimos precios: ' + error }, {status: 500});
  }
}
