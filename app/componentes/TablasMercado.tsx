'use client';
import { useEffect, useState } from 'react';
import { Archivo } from '../lib/descarga';

export default function Home() {
  const [archivos, setArchivos] = useState<{ archivoFruta?: Archivo | null, archivoHortaliza?: Archivo | null }>({ archivoFruta: null, archivoHortaliza: null });
  const [mostrarTablaFrutas, setMostrarTablaFrutas] = useState<boolean>(false);
  const [mostrarTablaHortalizas, setMostrarTablaHortalizas] = useState<boolean>(false);

  useEffect(() => {
    fetch('/api/descarga')
      .then(response => response.json())
      .then(data => setArchivos(data));
  }, []);

  if (!archivos.archivoFruta?.data || !archivos.archivoHortaliza?.data) {
    return <p>Cargando...</p>;
  }

  const frutas = archivos.archivoFruta;
  const hortalizas = archivos.archivoHortaliza;

  return (
    <div className='flex flex-col items-center p-3'>
      <h1 className='text-lg my-3'>Precios del Mercado Central de Buenos Aires</h1>
      <div className='flex flex-col w-full border p-2 w-2xl'>
        <div
        className={`flex items-center px-2 py-1 relative cursor-pointer after:content-["❯"] after:absolute after:right-2 after:top-1/2 after:-translate-y-1/2 ${mostrarTablaFrutas ? 'after:rotate-270' : 'after:rotate-90'}`}
        onClick={() => setMostrarTablaFrutas(!mostrarTablaFrutas)}
        >
          Precios de Frutas - {frutas.archivo}
        </div>
        <div className='flex justify-center'>
          <table className={`${mostrarTablaFrutas ? 'block' : 'hidden'} bg-white text-black`}>
            <thead>
              <tr>
                {Object.keys(frutas.data[0] as object).map(key => (
                  <th className='border border-gray-700'  key={key}>{key}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {frutas.data.map((row, index) => (
                <tr key={index}>
                  {Object.values(row as object).map((value, i) => (
                    <td className='border border-gray-700'  key={i}>{value}</td>
                  ))}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      <div className='flex flex-col w-full border p-2 w-2xl'>
        <div
        className={`flex items-center px-2 py-1 relative cursor-pointer after:content-["❯"] after:absolute after:right-2 after:top-1/2 after:-translate-y-1/2 ${mostrarTablaHortalizas ? 'after:rotate-270' : 'after:rotate-90'}`}
        onClick={() => setMostrarTablaHortalizas(!mostrarTablaHortalizas)}
        >
          Precios de Hortalizas - {hortalizas.archivo}
        </div>
        <div className='flex justify-center'>
          <table className={`${mostrarTablaHortalizas ? 'block' : 'hidden'} bg-white text-black`}>
            <thead>
              <tr>
                {Object.keys(hortalizas.data[0] as object).map(key => (
                  <th className='border border-gray-700' key={key}>{key}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {hortalizas.data.map((row, index) => (
                <tr key={index}>
                  {Object.values(row as object)?.map((value, i) => (
                    <td className='border border-gray-700' key={i}>{value}</td>
                  ))}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
