import { NextRequest, NextResponse } from 'next/server';
import { initPrecio, Precio } from '../../modelos/precio';
import { Op } from 'sequelize';

export async function GET(request: NextRequest) {
  try {
    await initPrecio();
    if (request.method === 'GET') {
      const frutasUnicas = await Precio.findAll({
        attributes: ['esp', 'var', 'cal', 'tam', 'proc'], // Columns to select
        group: ['esp', 'var', 'cal', 'tam', 'proc'], // Group by these columns
        where: { 
          archivo: { 
            [Op.like]: '%RF%' 
          }
        },
        raw: true // Optional: Returns plain JavaScript objects
      });
      const hortalizasUnicas = await Precio.findAll({
        attributes: ['esp', 'var', 'cal', 'tam', 'proc'], // Columns to select
        group: ['esp', 'var', 'cal', 'tam', 'proc'], // Group by these columns
        where: { 
          archivo: { 
            [Op.like]: '%RH%' 
          }
        },
        raw: true // Optional: Returns plain JavaScript objects
      });
      return NextResponse.json({
        frutasUnicas,
        hortalizasUnicas,
      });
    } else {
      return NextResponse.json({ message: 'Método no permitido' }, { status: 405 });
    }
  } catch (error) {
    return NextResponse.json({ message: 'Error recuperando productos: ' + error }, {status: 500});
  }
}
