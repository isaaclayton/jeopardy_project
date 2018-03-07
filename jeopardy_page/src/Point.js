import React, {Component} from 'react'
//import Wordfreq_Mouseover from './Wordfreq_mouseover'

export default class Point extends Component {
    
    render() {
        return (
            <circle 
                onMouseOver={()=>this.props.mouseIn(this.props)}
                onMouseOut={this.props.mouseOut}
                cx = {this.props.xScale(this.props.season)}
                cy = {this.props.yScale(this.props.ratio)}
                r = {this.props.size[0]/75}
                style = {{opacity: 0.2,}}
            />      ) 

    }
}