'use client';
import React, { useEffect, useState } from 'react';
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
import procesarDatosGrafico, { DatosGrafico } from '../lib/datosGrafico';

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
  const [datosFrutas, setDatosFrutas] = useState<DatosGrafico>();
  const [datosHortalizas, setDatosHortalizas] = useState<DatosGrafico>();
  const [mostrarGraficoFrutas, setMostrarGraficoFrutas] = useState<boolean>(false);
  const [mostrarGraficoHortalizas, setMostrarGraficoHortalizas] = useState<boolean>(false);

  useEffect(() => {
    // Obtener los datos del endpoint /api/precio
    axios.get('/api/precio')
      .then(response => {
        const frutas = response?.data?.filter((p: Precio) => p.archivo?.toLowerCase()?.includes('rf'));
        setDatosFrutas(procesarDatosGrafico(frutas));
        const hortalizas = response?.data?.filter((p: Precio) => p.archivo?.toLowerCase()?.includes('rh'));
        setDatosHortalizas(procesarDatosGrafico(hortalizas));
      })
      .catch(error => {
        console.error('Error obteniendo precios:', error);
      });
  }, []);

  const options = {
    responsive: true,
    plugins: {
      legend: {
        position: 'top' as const,
      },
      title: {
        display: true,
        text: 'Histórico de Precios',
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

  if (!datosFrutas || !datosHortalizas) {
    return <p>Cargando...</p>;
  }

  return (
    <div className='flex flex-col items-center p-3'>
      <div className='flex flex-col border w-full'>
        <div
          className={`flex items-center px-2 py-1 relative cursor-pointer after:content-["❯"] after:absolute after:right-2 after:top-1/2 after:-translate-y-1/2 ${mostrarGraficoFrutas ? 'after:rotate-270' : 'after:rotate-90'}`}
          onClick={() => setMostrarGraficoFrutas(!mostrarGraficoFrutas)}
        >
          Histórico Frutas
        </div>
        <div className={`${mostrarGraficoFrutas ? 'block' : 'hidden'}`}>
          <Line data={datosFrutas} options={options} />
        </div>
      </div>
      <div className='flex flex-col border w-full'>
        <div
          className={`flex items-center px-2 py-1 relative cursor-pointer after:content-["❯"] after:absolute after:right-2 after:top-1/2 after:-translate-y-1/2 ${mostrarGraficoHortalizas ? 'after:rotate-270' : 'after:rotate-90'}`}
          onClick={() => setMostrarGraficoHortalizas(!mostrarGraficoHortalizas)}
        >
          Histórico Hortalizas
        </div>
        <div className={`${mostrarGraficoHortalizas ? 'block' : 'hidden'}`}>
          <Line data={datosHortalizas} options={options} />
        </div>
      </div>
    </div>
  );
};

export default Historicos;
