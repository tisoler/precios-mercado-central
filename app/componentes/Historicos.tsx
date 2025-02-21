'use client';
import React, { ChangeEvent, useEffect, useRef, useState } from 'react';
import axios from 'axios';
import { Line } from 'react-chartjs-2';
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Title,
  Tooltip,
  Legend,
} from 'chart.js';
import { Precio } from '../modelos/precio';
import procesarDatosGrafico, { Dataset, DatosGrafico } from '../lib/datosGrafico';
import { useRouter } from 'next/navigation';

// Registrar los componentes necesarios de Chart.js
ChartJS.register(
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Title,
  Tooltip,
  Legend
);

const Historicos = () => {
  const [mostrarGraficoFrutas, setMostrarGraficoFrutas] = useState<boolean>(false);
  const [mostrarGraficoHortalizas, setMostrarGraficoHortalizas] = useState<boolean>(false);
  const [terminoBusquedaFrutas, setTerminoBusquedaFrutas] = useState('');
  const [terminoBusquedaHortalizas, setTerminoBusquedaHortalizas] = useState('');
  const frutas = useRef<DatosGrafico>(null);
  const [frutasVisibles, setFrutasVisibles] = useState<boolean[]>([]);
  const [frutasGrafico, setFrutasGrafico] = useState<DatosGrafico>();
  const hortalizas = useRef<DatosGrafico>(null);
  const [hortalizasVisibles, setHortalizasVisibles] = useState<boolean[]>([]);
  const [hortalizasGrafico, setHortalizasGrafico] = useState<DatosGrafico>();
  const router = useRouter();

  useEffect(() => {
    // Obtener los datos del endpoint /api/precio
    axios.get('/api/precio')
      .then(response => {
        const dataFrutas = response?.data?.filter((p: Precio) => p.archivo?.toLowerCase()?.includes('rf'));
        frutas.current = procesarDatosGrafico(dataFrutas);
        setFrutasVisibles(Array(frutas.current?.datasets?.length).fill(0));
        const dataHortalizas = response?.data?.filter((p: Precio) => p.archivo?.toLowerCase()?.includes('rh'));
        hortalizas.current = procesarDatosGrafico(dataHortalizas);
        setHortalizasVisibles(Array(hortalizas.current?.datasets?.length).fill(0));
      })
      .catch(error => {
        console.error('Error obteniendo precios:', error);
      });
  }, []);

  const options = {
    responsive: true,
    plugins: {
      legend: {
        display: false,
      },
      title: {
        display: false,
      },
    },
    scales: {
      x: {
        title: {
          display: true,
          text: 'Fecha',
        },
      },
      y: {
        title: {
          display: true,
          text: 'Precio',
        },
      },
    },
    elements: {
      line: {
        borderWidth: 1,
      },
    },
  };

  const manejadorCambioTerminoFrutas = (event: ChangeEvent<HTMLInputElement>) => {
    const value = event.target.value;
    setTerminoBusquedaFrutas(value);
  };

  const manejadorCambioTerminoHortalizas = (event: ChangeEvent<HTMLInputElement>) => {
    const value = event.target.value;
    setTerminoBusquedaHortalizas(value);
    hortalizas.current?.datasets.filter((dataset: Dataset) =>
      dataset.label.toLowerCase().includes(value?.toLowerCase())
    );
  };

  const cambiarVisibilidadFrutas = (index: number) => {
    const copiaFrutasVisibles = [...frutasVisibles];
    copiaFrutasVisibles[index] = !copiaFrutasVisibles[index];
    setFrutasVisibles(copiaFrutasVisibles);
  };

  const cambiarVisibilidadHortalizas = (index: number) => {
    const copiaHortalizasVisibles = [...hortalizasVisibles];
    copiaHortalizasVisibles[index] = !copiaHortalizasVisibles[index];
    setHortalizasVisibles(copiaHortalizasVisibles);
  };

  useEffect(() => {
    setFrutasGrafico({
      labels: frutas.current?.labels || [],
      datasets: frutas.current?.datasets.filter((_, index) => frutasVisibles[index]) || [],
    });
    setHortalizasGrafico({
      labels: hortalizas.current?.labels || [],
      datasets: hortalizas.current?.datasets.filter((_, index) => hortalizasVisibles[index]) || [],
    });
  }, [frutasVisibles, hortalizasVisibles]);

  if (!frutasGrafico || !hortalizasGrafico) {
    return <p>Cargando...</p>;
  }

  return (
    <>
      <div className='flex flex-col items-center px-3 py-1'>
        <div className='flex w-full justify-between items-center mt-3 mb-1 px-4'>
          <div className='flex w-full justify-center'>
            <h1 className='text-lg'>Histórico de precios</h1>
          </div>
          <button onClick={() => router.push('/')} className='bg-green-700 hover:bg-white hover:text-green-800 active:bg-green-700 rounded-sm p-2'>Volver</button>
        </div>
        <div className='flex flex-col border w-full'>
          <div
            className={`flex items-center px-2 py-1 relative cursor-pointer after:content-["❯"] after:absolute after:right-2 after:top-1/2 after:-translate-y-1/2 ${mostrarGraficoFrutas ? 'after:rotate-270' : 'after:rotate-90'}`}
            onClick={() => setMostrarGraficoFrutas(!mostrarGraficoFrutas)}
          >
            Histórico Frutas
          </div>
          {/* Buscador */}
          <div className={`${mostrarGraficoFrutas ? 'block' : 'hidden'} z-50 flex flex-col relative mx-2 mt-3 mb-8`}>
            <div className='flex gap-2 items-center'>
              Buscar:
              <input
                type="text"
                className='ml-2 text-black p-2 w-full max-w-[300px]'
                placeholder="Buscar fruta..."
                value={terminoBusquedaFrutas}
                onChange={manejadorCambioTerminoFrutas}
              />
              <button
                onClick={() => setFrutasVisibles(Array(frutas.current?.datasets.length).fill(false))}
                className='bg-green-800 p-2 rounded-sm hover:bg-green-600 active:bg-green-800'
              >
                Deseleccionar todos
              </button>
            </div>
            {terminoBusquedaFrutas.length >= 3 && (
              <ul className='absolute overflow-y-auto top-10 bg-white text-black w-fit p-2 border border-gray-800 max-h-80' style={{ listStyle: 'none' }}>
                {frutas.current?.datasets?.map((dataset, index) => {
                  return (
                    <li
                      key={index}
                      className={`${dataset.label.toLowerCase().includes(terminoBusquedaFrutas?.toLowerCase()) ? 'block' : 'hidden'} p-2 cursor-pointer hover:bg-green-300`}
                      onClick={(e) => {
                        e.preventDefault();
                        cambiarVisibilidadFrutas(index)
                      }}
                    >
                      <label className='cursor-pointer'>
                        <input
                          type="checkbox"
                          checked={frutasVisibles[index]}
                          className='mr-2 cursor-pointer'
                          onChange={() => cambiarVisibilidadFrutas(index)}
                        />
                        {dataset.label}
                      </label>
                    </li>
                  )}
                )}
              </ul>
            )}
          </div>
          {/* Fin Buscador */}
          <div className={`${mostrarGraficoFrutas ? 'block' : 'hidden'} h-[75vh] flex justify-center`}>
            <Line data={frutasGrafico} options={options} />
          </div>
        </div>
        <div className='flex flex-col border w-full'>
          <div
            className={`flex items-center px-2 py-1 relative cursor-pointer after:content-["❯"] after:absolute after:right-2 after:top-1/2 after:-translate-y-1/2 ${mostrarGraficoHortalizas ? 'after:rotate-270' : 'after:rotate-90'}`}
            onClick={() => setMostrarGraficoHortalizas(!mostrarGraficoHortalizas)}
          >
            Histórico Hortalizas
          </div>
          {/* Buscador */}
          <div className={`${mostrarGraficoHortalizas ? 'block' : 'hidden'} z-50 flex flex-col relative mx-2 mt-3 mb-8`}>
            <div className='flex gap-2 items-center'>
              Buscar:
              <input
                type="text"
                className='ml-2 text-black p-2 w-full max-w-[300px]'
                placeholder="Buscar hortaliza..."
                value={terminoBusquedaHortalizas}
                onChange={manejadorCambioTerminoHortalizas}
              />
              <button
                onClick={() => setHortalizasVisibles(Array(hortalizas.current?.datasets.length).fill(false))}
                className='bg-green-800 p-2 rounded-sm hover:bg-green-600 active:bg-green-800'
              >
                Deseleccionar todos
              </button>
            </div>
            {terminoBusquedaHortalizas.length >= 3 && (
              <ul className='absolute overflow-y-auto top-10 bg-white text-black w-fit p-2 border border-gray-800 max-h-80' style={{ listStyle: 'none' }}>
                {hortalizas.current?.datasets?.map((dataset, index) => {
                  return (
                    <li
                      key={index}
                      className={`${dataset.label.toLowerCase().includes(terminoBusquedaHortalizas?.toLowerCase()) ? 'block' : 'hidden'} p-2 cursor-pointer hover:bg-green-300`}
                      onClick={(e) => {
                        e.preventDefault();
                        cambiarVisibilidadHortalizas(index)
                      }}
                    >
                      <label className='cursor-pointer'>
                        <input
                          type="checkbox"
                          checked={hortalizasVisibles[index]}
                          className='mr-2 cursor-pointer'
                          onChange={() => cambiarVisibilidadHortalizas(index)}
                        />
                        {dataset.label}
                      </label>
                    </li>
                  )}
                )}
              </ul>
            )}
          </div>
          {/* Fin Buscador */}
          <div className={`${mostrarGraficoHortalizas ? 'block' : 'hidden'} h-[75vh] flex justify-center`}>
            <Line data={hortalizasGrafico} options={options} />
          </div>
        </div>
      </div>
      {/* div para hacer click afuera de la lista de búsqueda y cerrar las listas */}
      <div
        className={`absolute w-screen h-screen top-0 left-0 bg-black z-40 opacity-50 ${terminoBusquedaFrutas.length >= 3 || terminoBusquedaHortalizas.length >= 3 ? 'block' : 'hidden'}`}
        onClick={() => {
          setTerminoBusquedaFrutas('');
          setTerminoBusquedaHortalizas('');
        }}
      />
    </>
  );
};

export default Historicos;
