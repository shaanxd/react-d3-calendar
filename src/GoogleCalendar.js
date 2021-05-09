import React, { useEffect, useRef, useState } from 'react';
import styled from 'styled-components';
import PropTypes from 'prop-types';
import * as d3 from 'd3';
import moment from 'moment';

import './GoogleCalendar.scss';

const BAR_COLOR = '#F0255D';

const Chart = styled.svg`
  width: 100%;
  height: 100%;
`;

function drawChart(
  element,
  data,
  animate,
  yTopPadding,
  yBottomPadding,
  xLeftPadding,
  xRightPadding,
  xBarWidthPercentage,
  currentMarkerHeight,
  currentMarkerCircleRadius,
  barBorderRadius,
  xAxisTickSize,
  yAxisTickSize
) {
  const svg = d3.select(element);
  svg.selectAll('*').remove();

  const width = parseFloat(svg.style('width').replace('px', ''));
  const height = parseFloat(svg.style('height').replace('px', ''));

  const chart = svg.append('g');

  const [xMin, xMax] = d3.extent(data.map((d) => d.x));

  const yScale = d3
    .scaleTime()
    .domain([moment().startOf('day').toDate(), moment().endOf('day').toDate()])
    .range([0, height - (yTopPadding + yBottomPadding)])
    .nice();

  const xScale = d3
    .scaleTime()
    .domain([moment(xMin).subtract(1, 'day').toDate(), xMax])
    .range([0, width - (xLeftPadding + yAxisTickSize + xRightPadding)]);

  function drawYAxis() {
    chart
      .append('g')
      .attr('class', 'chart-grid')
      .attr(
        'transform',
        `translate(${xLeftPadding + yAxisTickSize}, ${yTopPadding})`
      )
      .call(
        d3
          .axisLeft(yScale)
          .ticks(24)
          .tickSize(xLeftPadding + yAxisTickSize + xRightPadding - width)
          .tickSizeOuter(0)
          .tickFormat('')
      )
      .selectAll('.tick')
      .filter((_, i) => i === 0)
      .style('visibility', 'hidden');

    chart
      .append('g')
      .attr('class', 'chart-axis y-axis')
      .attr(
        'transform',
        `translate(${xLeftPadding + yAxisTickSize}, ${yTopPadding})`
      )
      .call(
        d3
          .axisLeft(yScale)
          .ticks(24)
          .tickFormat(d3.timeFormat('%H:%M'))
          .tickPadding(10)
          .tickSize(yAxisTickSize)
          .tickSizeOuter(0)
      )
      .selectAll('text')
      .filter((_, i, list) => i === list.length - 1)
      .style('visibility', 'hidden');
  }

  function drawXAxis() {
    chart
      .append('g')
      .attr('class', 'chart-grid')
      .attr(
        'transform',
        `translate(${xLeftPadding + yAxisTickSize}, ${yTopPadding})`
      )
      .call(
        d3
          .axisTop(xScale)
          .ticks(data.length)
          .tickSize(yTopPadding + yBottomPadding - height)
          .tickSizeOuter(0)
          .tickFormat('')
      )
      .selectAll('.tick')
      .filter((_, i) => i === 0)
      .style('visibility', 'hidden');

    const xAxisContainer = chart
      .append('g')
      .attr('class', 'chart-axis x-axis')
      .attr(
        'transform',
        `translate(${xLeftPadding + yAxisTickSize}, ${yTopPadding})`
      );

    xAxisContainer
      .call(
        d3
          .axisTop(xScale)
          .ticks(data.length)
          .tickValues(data.map((d) => d.x))
          .tickFormat(d3.timeFormat('%d'))
          .tickSize(xAxisTickSize)
          .tickPadding(15)
      )
      .selectAll('text')
      .style('font-size', '26px')
      .attr(
        'transform',
        `translate(${-width / data.length / 2}, ${xAxisTickSize})`
      );

    xAxisContainer
      .selectChildren('.tick')
      .data(data)
      .append('text')
      .text((d) => d3.timeFormat('%a')(d.x))
      .attr(
        'transform',
        `translate(${-width / data.length / 2}, ${-15 * 2 - 20})`
      )
      .style('font-size', '11px');
  }

  function getXScalePosition(xValue) {
    return xScale(moment(xValue).subtract(1, 'day').toDate());
  }

  function getXBarPosition(xValue) {
    return (
      getXScalePosition(xValue) +
      ((width - (xLeftPadding + yAxisTickSize + xRightPadding)) / data.length) *
        (1 - xBarWidthPercentage) *
        0.25
    );
  }

  function getYScalePosition(yValue) {
    return yScale(yValue);
  }

  function getXGroupWidth() {
    return (
      (width - (xLeftPadding + yAxisTickSize + xRightPadding)) / data.length
    );
  }

  function getBarWidth() {
    return getXGroupWidth() * xBarWidthPercentage;
  }

  function getBarHeight(data) {
    return animate
      ? 0
      : (((height - (yTopPadding + yBottomPadding)) / 24) *
          moment(data.values.end).diff(moment(data.values.start))) /
          1000 /
          60 /
          60;
  }

  function getDifferenceInTimeSpans(start, end) {
    return moment(end).diff(moment(start), 'minutes');
  }

  function drawBars() {
    const filteredData = data.filter(
      ({ values: { start, end } }, i) =>
        getDifferenceInTimeSpans(start, end) > 15
    );

    const parentNode = chart
      .append('g')
      .attr(
        'transform',
        `translate(${xLeftPadding + yAxisTickSize}, ${yTopPadding})`
      );

    parentNode
      .selectAll('rect')
      .data(filteredData)
      .join('rect')
      .attr('x', (d) => getXBarPosition(d.x))
      .attr('y', (d) => getYScalePosition(d.values.start))
      .attr('rx', barBorderRadius)
      .attr('width', getBarWidth())
      .attr('height', (d) => getBarHeight(d))
      .attr('fill', (d) => d.color || BAR_COLOR);

    parentNode
      .selectAll('text')
      .data(filteredData)
      .join('text')
      .attr('x', (d) => getXBarPosition(d.x))
      .attr('y', (d) => getYScalePosition(d.values.start))
      .attr('width', getBarWidth())
      .text(
        (d) =>
          `(${d.title}) ${moment(d.values.start).format('h:mm A')} - ${moment(
            d.values.end
          ).format('h:mm A')}`
      )
      .style('fill', '#ffffff')
      .style('font-size', ({ values: { start, end } }) =>
        getDifferenceInTimeSpans(start, end) > 30 ? '12px' : '11px'
      )
      .attr('transform', function ({ values: { start, end } }) {
        return `translate(${5}, ${this.getBBox().height * (getDifferenceInTimeSpans(start, end) > 30 ? 1 : 0.85)})`;
      });

    if (animate) {
      parentNode
        .selectAll('rect')
        .transition()
        .duration(1000)
        .attr(
          'height',
          (d) =>
            (((height - (yTopPadding + yBottomPadding)) / 24) *
              moment(d.values.end).diff(moment(d.values.start))) /
            1000 /
            60 /
            60
        );
    }
  }

  function drawCurrentMarker() {
    const filteredData = data.filter(({ x }) =>
      moment(x).isSame(moment(), 'day')
    );
    if (filteredData.length === 0) {
      return;
    }
    const parentNode = chart
      .append('g')
      .attr(
        'transform',
        `translate(${xLeftPadding + yAxisTickSize}, ${yTopPadding})`
      );

    const [{ x: markerXPosition }] = filteredData;

    parentNode
      .append('rect')
      .attr('x', getXScalePosition(markerXPosition))
      .attr('y', getYScalePosition(moment().toDate()))
      .attr('width', getXGroupWidth())
      .attr('height', currentMarkerHeight)
      .attr('fill', '#EA4334');

    parentNode
      .append('circle')
      .attr('cx', getXScalePosition(markerXPosition))
      .attr('cy', getYScalePosition(moment().toDate()))
      .attr('r', currentMarkerCircleRadius)
      .attr('fill', '#EA4334')
      .attr('transform', function () {
        return `translate(${0}, ${currentMarkerHeight / 2})`;
      });
  }

  drawYAxis();
  drawXAxis();
  drawCurrentMarker();
  drawBars();
}

function useWindowWidthResize() {
  const [width, setWidth] = useState(window.innerWidth);

  useEffect(() => {
    let timeout = null;

    function handleResize() {
      clearTimeout(timeout);
      timeout = setTimeout(() => {
        setWidth(window.innerWidth);
      }, 400);
    }

    window.addEventListener('resize', handleResize);

    return () => {
      window.removeEventListener('resize', handleResize);
      clearTimeout(timeout);
    };
  }, []);

  return width;
}

function GoogleCalendar({
  animate,
  data,
  yTopPadding,
  xRightPadding,
  xLeftPadding,
  yBottomPadding,
  xBarWidthPercentage,
  currentMarkerHeight,
  currentMarkerCircleRadius,
  barBorderRadius,
  xAxisTickSize,
  yAxisTickSize,
}) {
  const svgRef = useRef(null);
  const width = useWindowWidthResize();

  useEffect(() => {
    drawChart(
      svgRef.current,
      data,
      animate,
      yTopPadding,
      yBottomPadding,
      xLeftPadding,
      xRightPadding,
      xBarWidthPercentage,
      currentMarkerHeight,
      currentMarkerCircleRadius,
      barBorderRadius,
      xAxisTickSize,
      yAxisTickSize
    );
  }, [
    data,
    animate,
    xLeftPadding,
    xRightPadding,
    yBottomPadding,
    yTopPadding,
    xBarWidthPercentage,
    currentMarkerHeight,
    currentMarkerCircleRadius,
    barBorderRadius,
    xAxisTickSize,
    yAxisTickSize,
    width,
  ]);

  return <Chart ref={svgRef} />;
}

GoogleCalendar.propTypes = {
  animate: PropTypes.bool,
  data: PropTypes.arrayOf(
    PropTypes.shape({
      title: PropTypes.string,
      x: PropTypes.instanceOf(Date),
      values: PropTypes.shape({
        start: PropTypes.instanceOf(Date),
        end: PropTypes.instanceOf(Date),
      }),
      color: PropTypes.string,
    })
  ).isRequired,
  xLeftPadding: PropTypes.number,
  xRightPadding: PropTypes.number,
  yTopPadding: PropTypes.number,
  yBottomPadding: PropTypes.number,
  xBarWidthPercentage: PropTypes.number,
  currentMarkerHeight: PropTypes.number,
  currentMarkerCircleRadius: PropTypes.number,
  barBorderRadius: PropTypes.number,
  xAxisTickSize: PropTypes.number,
  yAxisTickSize: PropTypes.number,
};

GoogleCalendar.defaultProps = {
  animate: false,
  xLeftPadding: 50,
  xRightPadding: 25,
  yTopPadding: 75,
  yBottomPadding: 25,
  xBarWidthPercentage: 0.8,
  currentMarkerHeight: 2.5,
  currentMarkerCircleRadius: 6,
  barBorderRadius: 5,
  xAxisTickSize: 10,
  yAxisTickSize: 10,
};

export default GoogleCalendar;
