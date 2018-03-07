import React from 'react';
export default function ToolTip({data, style_, textFunc, xyCoords, size, boxSize, x}) {
    const width=boxSize[0];
    const height=boxSize[1];
    const coords = xyCoords({width: width, height: height, data: data, size: size});
  return (
      <g 
          style={style_} 
          transform={`translate(${coords[0]},${coords[1]})`}>
          <rect width={width} height={height} text={'hi'} fill={'#D3D3D3'}> </rect>
          {textFunc({height: height, width: width, data: data, x: x})}
      </g>
  )
}