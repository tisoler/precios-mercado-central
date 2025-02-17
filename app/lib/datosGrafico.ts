import { Precio } from "../modelos/precio";

interface Dataset {
  label: string;
  data: number[];
  borderColor: string;
  fill: boolean;
}

export type DatosGrafico = {
  labels: string[],
  datasets: Dataset[],
};

const procesarDatosGrafico = (data: Precio[]): DatosGrafico => {
  // Obtener todas las fechas únicas
  const uniqueDates = [...new Set(data.map(item => item.fecha))];
  const labels = uniqueDates.sort(); // Ordenar las fechas si es necesario

  const datasets: Dataset[] = [];

  // Crear un conjunto de datos para cada combinación de esp y var
  const uniqueCombinations = [...new Set(data.map(item => `${item.esp}-${item.var}-${item.cal}-${item.tam}-${item.proc}`))];

  uniqueCombinations.forEach(combination => {
    const [espValue, varValue, calValue, tamValue, procValue] = combination.split('-');
    const filteredData = data.filter(item => item.esp === espValue && item.var === varValue && item.cal === calValue && item.tam === tamValue && item.proc === procValue);

    const color = Math.floor(Math.random()*16777215).toString(16);
    datasets.push({
      label: `${espValue}-${varValue}-${calValue}-${tamValue}-${procValue}`,
      data: filteredData.map(item => item.ma),
      borderColor: `#${color}`, // Color aleatorio
      fill: false,
      // eslint-disable-next-line @typescript-eslint/ban-ts-comment
      // @ts-ignore
      hidden: true,
    });

    datasets.push({
      label: `${espValue}-${varValue}-${calValue}-${tamValue}-${procValue}(MAPK)`,
      data: filteredData.map(item => item.mapk),
      borderColor: `#${color}`, // Color aleatorio
      fill: false,
      // eslint-disable-next-line @typescript-eslint/ban-ts-comment
      // @ts-ignore
      hidden: true,
    });
  });

  return {
    labels,
    datasets,
  };
};

export default procesarDatosGrafico;
