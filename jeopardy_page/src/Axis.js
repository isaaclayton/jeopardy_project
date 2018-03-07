import React, { Component } from 'react'
import * as d3Axis from 'd3-axis'
import {select} from 'd3-selection'

import './Axis.css'

export default class Axis extends Component {
  componentDidMount() {
    this.renderAxis()
  }

  componentDidUpdate() {
    this.renderAxis()
  }

  renderAxis() {
    const axisType = `axis${this.props.orient}`
    const axis = d3Axis[axisType]()
      .scale(this.props.scale)
      .tickSize(-this.props.tickSize)
      .ticks([8])

    select(this.axisElement).call(axis)
  }

  render() {
    return (
      <g
        className={`Axis Axis-${this.props.orient}`}
        ref={d => { this.axisElement = d; }}
        transform={this.props.translate}
      />
    )
  }
}