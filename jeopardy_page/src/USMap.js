import React, { Component } from 'react';
import './App.css';
import {geoAlbersUsa, geoPath} from 'd3-geo';
import {extent} from 'd3-array';
import {scaleQuantize} from 'd3-scale';
import colorbrewer from 'colorbrewer';
import ToolTip from './ToolTip'

export default class USMap extends Component {
    
    constructor(props) {
        super(props);
        const x = this.props.x;
        this.state =  {hover: false, 
                       hoverID: -1,
                       data: {properties : {latitude: 40.1135, longitude: -111.8535}, size: this.props.size}
                      }
        this.state.data.properties[x] = 0;
    }
    
    
    mouseIn(d,i) {
        this.setState({hover: true, data: d, hoverID: i});
    }
    
    mouseOut() {
        this.setState({hover: false, hoverID: -1});
    }
    
    render() {
        let scaleFactor = 0.0021;
        if (this.props.size[0]>this.props.size[1]) {
            scaleFactor = 0.003;
        }
        else if (this.props.size[0]/this.props.size[1] < 0.44) {
            scaleFactor = 0.0015
        }
        const projection = geoAlbersUsa()
        .scale(this.props.size[0]*this.props.size[1]*scaleFactor)
        .translate([this.props.size[0]*0.5,this.props.size[1]*0.5])
        const pathGenerator = geoPath().projection(projection);
        const featureSize = extent(this.props.data, d=> d.properties[this.props.x]);
        const stateColor = scaleQuantize().domain(featureSize).range(colorbrewer.PuBu[9]);
        const toolTipStyle = {
          visibility: this.state.hover ? 'visible' : 'hidden',
          opacity: 0.9
        }
        const countries = this.props.data
        .map((d,i) => <path
            key={'path' + i}
            d={pathGenerator(d)}
            onMouseOver={()=> this.mouseIn(d,i)}
            onMouseOut={()=> this.mouseOut()}
            style={{fill: this.state.hoverID===i ? '#6666FF' : stateColor(d.properties[this.props.x]), 
                  stroke: 'black', strokeOpacity: 0.5}}
            className='countries'
        />)
        return <svg width={this.props.size[0]} height={this.props.size[1]}>
        {countries}
        <ToolTip data={this.state.data} style_={toolTipStyle} textFunc={toolTipText} xyCoords={toolTipCoords} boxSize={[175, 50]} size={this.props.size} x={this.props.x}/>
        {console.log(this.props.size[0])}
        {console.log(this.props.size[1])}
        </svg>
    }
}
             
function toolTipText({width, height, data, x}) {
            return (
                <g>
                    <text style={{fontSize:height/4}} x={width/15} y={height/2.5}> State: {data.properties.NAME} </text>
                    <text style={{fontSize:height/4}} x={width/15} y={2*height/2.5}>{x==='streak' ? 'Average Streak' : 'Win Rate'}: {
                x === 'streak' ? (Math.floor(data.properties[x]*100)/100 + ' days') :
                (data.properties[x]===0 ? "no data available" : Math.floor(data.properties[x]*100) + "%")} </text>
                </g>
            )
}
        
function toolTipCoords({width, height, data, size}) {
    let scaleFactor = 0.0021;
    if (size[0]>size[1]) {
        scaleFactor = 0.003
    }
    else if (size[0]/size[1] < 0.44) {
            scaleFactor = 0.0015
        }
    const projection = geoAlbersUsa()
        .scale(size[0]*size[1]*scaleFactor)
        .translate([size[0]*0.5,size[1]*0.5])
    const center = projection([data.properties.longitude, data.properties.latitude]);
    if (center[0] + width > size[0]) {
        center[0]-=width;
        if (center[0] < 0) {
        center[0]+=0.5*width;
    }
    }

    return center
}