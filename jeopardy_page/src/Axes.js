
import React from 'react'
import Axis from './Axis'

export default ({size, scales, margins}) => {
  const xProps = {
    orient: 'Bottom',
    scale: scales.xScale,
    translate: `translate(0, ${size[1] - margins[1]})`,
    tickSize: size[1] - 2*margins[1],
  }

  const yProps = {
    orient: 'Left',
    scale: scales.yScale,
    translate: `translate(${margins[0]}, 0)`,
    tickSize: size[0] - 2*margins[0],
  }

  return (
    <g>
      <Axis {...xProps} />
      <Axis {...yProps} />
    </g>
  )
}