import { NextRequest, NextResponse } from 'next/server';
import { initPrecio, Precio } from '../../../modelos/precio';
import { Op } from 'sequelize';
import descargarUltimosPrecios from '../../../lib/descarga';

export async function GET(request: NextRequest) {
  try {
    await descargarUltimosPrecios();

    await initPrecio();
    if (request.method === 'GET') {
      const precios = await Precio.findAll({
        where: {
          fecha: {
            [Op.eq]: await Precio.max('fecha') as string,
          }
        }
    }) || [];

      return NextResponse.json(precios);
    } else {
      return NextResponse.json({ message: 'Método no permitido' }, { status: 405 });
    }
  } catch (error) {
    return NextResponse.json({ message: 'Error recuperando últimos precios: ' + error }, {status: 500});
  }
}
