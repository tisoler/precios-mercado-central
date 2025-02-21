'use client';
import { useEffect, useState } from 'react';
import { Precio } from '../modelos/precio';
import { useRouter } from 'next/navigation';

export default function Home() {
  const [precios, setPrecios] = useState<Precio[]>([]);
  const [mostrarTablaFrutas, setMostrarTablaFrutas] = useState<boolean>(false);
  const [mostrarTablaHortalizas, setMostrarTablaHortalizas] = useState<boolean>(false);
  const [cargando, setCargando] = useState<boolean>(true);
  const router = useRouter();

  useEffect(() => {
    setCargando(true);
    fetch('/api/precio/ultimos')
      .then(response => response.json())
      .then(data => {
        setPrecios(data);
        setCargando(false);
      })
      .catch(() => setCargando(false));
  }, []);

  if (cargando) {
    return <p>Cargando...</p>;
  }

  if (!precios?.length) {
    return <h3>No hay precios para mostrar.</h3>
  }

  const frutas = precios.filter(p => p.archivo?.includes('RF'));
  const hortalizas = precios.filter(p => p.archivo?.includes('RH'));

  return (
    <div className='flex flex-col items-center p-3'>
      <div className='flex w-full justify-between items-center my-3 px-4'>
        <div className='flex w-full justify-center'>
          <h1 className='text-lg'>Precios del Mercado Central de Buenos Aires</h1>
        </div>
        <button onClick={() => router.push('/historicos')} className='bg-green-700 hover:bg-white hover:text-green-800 active:bg-green-700 rounded-sm p-3'>Históricos</button>
      </div>
      <div className='flex flex-col w-full border p-2 w-2xl'>
        <div
          className={`flex items-center px-2 py-1 relative cursor-pointer after:content-["❯"] after:absolute after:right-2 after:top-1/2 after:-translate-y-1/2 ${mostrarTablaFrutas ? 'after:rotate-270' : 'after:rotate-90'}`}
          onClick={() => setMostrarTablaFrutas(!mostrarTablaFrutas)}
        >
          Precios de Frutas - {frutas[0].archivo}
        </div>
        <div className='flex justify-center'>
          <table className={`${mostrarTablaFrutas ? 'block' : 'hidden'} bg-white text-black overflow-y-auto`}>
            <thead>
              <tr>
                <th className='border border-gray-700'>ESP</th>
                <th className='border border-gray-700'>MA</th>
                <th className='border border-gray-700'>MAPK</th>
                <th className='border border-gray-700'>ENV</th>
                <th className='border border-gray-700'>KG</th>
                <th className='border border-gray-700'>CAL</th>
                <th className='border border-gray-700'>PROC</th>
                <th className='border border-gray-700'>VAR</th>
                <th className='border border-gray-700'>TAM</th>
              </tr>
            </thead>
            <tbody>
              {frutas.map((precio, index) => (
                <tr key={index}>
                  <td className='border border-gray-700' key={`F-${precio.id}-ESP`}>{precio.esp}</td>
                  <td className='border border-gray-700' key={`F-${precio.id}-MA`}>{precio.ma}</td>
                  <td className='border border-gray-700' key={`F-${precio.id}-MAPK`}>{precio.mapk}</td>
                  <td className='border border-gray-700' key={`F-${precio.id}-ENV`}>{precio.env}</td>
                  <td className='border border-gray-700' key={`F-${precio.id}-KG`}>{precio.kg}</td>
                  <td className='border border-gray-700' key={`F-${precio.id}-CAL`}>{precio.cal}</td>
                  <td className='border border-gray-700' key={`F-${precio.id}-PROC`}>{precio.proc}</td>
                  <td className='border border-gray-700' key={`F-${precio.id}-VAR`}>{precio.var}</td>
                  <td className='border border-gray-700' key={`F-${precio.id}-TAM`}>{precio.tam}</td>
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
          Precios de Hortalizas - {hortalizas[0].archivo}
        </div>
        <div className='flex justify-center'>
          <table className={`${mostrarTablaHortalizas ? 'block' : 'hidden'} bg-white text-black overflow-y-auto`}>
            <thead>
              <tr>
                <th className='border border-gray-700'>ESP</th>
                <th className='border border-gray-700'>MA</th>
                <th className='border border-gray-700'>MAPK</th>
                <th className='border border-gray-700'>ENV</th>
                <th className='border border-gray-700'>KG</th>
                <th className='border border-gray-700'>CAL</th>
                <th className='border border-gray-700'>PROC</th>
                <th className='border border-gray-700'>VAR</th>
                <th className='border border-gray-700'>TAM</th>
              </tr>
            </thead>
            <tbody>
              {hortalizas?.map((precio, index) => (
                <tr key={index}>
                  <td className='border border-gray-700' key={`H-${precio.id}-ESP`}>{precio.esp}</td>
                  <td className='border border-gray-700' key={`H-${precio.id}-MA`}>{precio.ma}</td>
                  <td className='border border-gray-700' key={`H-${precio.id}-MAPK`}>{precio.mapk}</td>
                  <td className='border border-gray-700' key={`H-${precio.id}-ENV`}>{precio.env}</td>
                  <td className='border border-gray-700' key={`H-${precio.id}-KG`}>{precio.kg}</td>
                  <td className='border border-gray-700' key={`H-${precio.id}-CAL`}>{precio.cal}</td>
                  <td className='border border-gray-700' key={`H-${precio.id}-PROC`}>{precio.proc}</td>
                  <td className='border border-gray-700' key={`H-${precio.id}-VAR`}>{precio.var}</td>
                  <td className='border border-gray-700' key={`H-${precio.id}-TAM`}>{precio.tam}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
