import { NextRequest, NextResponse } from 'next/server';
import { initPrecio, Precio } from '../../modelos/precio';

export async function GET(request: NextRequest) {
  try {
    await initPrecio();
    if (request.method === 'GET') {
      const precios = await Precio.findAll() || [];

      return NextResponse.json(precios);
    } else {
      return NextResponse.json({ message: 'Método no permitido' }, { status: 405 });
    }
  } catch (error) {
    return NextResponse.json({ message: 'Error recuperando precios: ' + error }, {status: 500});
  }
}

export async function POST(request: NextRequest) {
  try {
    await initPrecio();
    const precios = await request.json();

    await Precio.bulkCreate(precios);

    return NextResponse.json({ message: 'Precios actualizados exitosamente' });
  } catch (error) {
    return NextResponse.json({ message: 'Error actualizando precios: ' + error }, { status: 500 });
  }
}
