import React, { useEffect, useRef, useState } from "react";
import styled from "styled-components";
import PropTypes from "prop-types";
import * as d3 from "d3";
import moment from "moment";

import "./GoogleCalendar.scss";

const BAR_HEIGHT = 75;

const Chart = styled.div`
  width: 100%;
  height: 100%;
  display: flex;
  flex-direction: column;
  box-sizing: border-box;
`;

function getDimensions(element) {
  return {
    width: parseFloat(element.style("width").replace("px", "")),
    height: parseFloat(element.style("height").replace("px", "")),
  };
}

function drawChart(
  element,
  data,
  animate,
  xLeftPadding,
  xBarWidthPercentage,
  currentMarkerHeight,
  currentMarkerCircleRadius,
  barBorderRadius,
  xAxisTickSize,
  yAxisTickSize,
  hideOnHover,
  hideOpacity
) {
  const body = d3.select(element);
  body.selectAll("*").remove();

  const { width, height } = getDimensions(body);

  const headerParent = body.append("div");
  const scrollableParent = body.append("div");

  scrollableParent.style("overflow", "auto");
  scrollableParent.style("flex", 1);

  headerParent.style("display", "flex");

  const { width: headerWidth } = getDimensions(headerParent);

  const barWidth = (headerWidth - xLeftPadding) / data.length;

  const scrollableSvg = scrollableParent.append("svg");
  const headerSvg = headerParent.append("svg");

  scrollableSvg.style("width", `${width}px`);
  scrollableSvg.style("height", `${BAR_HEIGHT * 24}px`);
  headerSvg.style("width", `${width}px`);

  const scrollableMasterGroup = scrollableSvg.append("g");
  const headerMasterGroup = headerSvg.append("g");

  const [xMin, xMax] = d3.extent(data.map((d) => d.x));

  const yScale = d3
    .scaleTime()
    .domain([moment().startOf("day").toDate(), moment().endOf("day").toDate()])
    .range([0, BAR_HEIGHT * 24])
    .nice();

  const xScale = d3
    .scaleTime()
    .domain([moment(xMin).subtract(1, "day").toDate(), xMax])
    .range([0, barWidth * data.length]);

  function drawYAxis() {
    scrollableMasterGroup
      .append("g")
      .attr("class", "chart-grid")
      .attr("transform", `translate(${xLeftPadding}, ${0})`)
      .call(
        d3
          .axisLeft(yScale)
          .ticks(24)
          .tickSize(-barWidth * data.length)
          .tickSizeOuter(0)
          .tickFormat("")
      )
      .selectAll(".tick")
      .filter((_, i) => i === 0)
      .style("visibility", "hidden");

    scrollableMasterGroup
      .append("g")
      .attr("class", "chart-axis y-axis")
      .attr("transform", `translate(${xLeftPadding}, ${0})`)
      .call(
        d3
          .axisLeft(yScale)
          .ticks(24)
          .tickFormat(d3.timeFormat("%H:%M"))
          .tickPadding(10)
          .tickSize(yAxisTickSize)
          .tickSizeOuter(0)
      )
      .selectAll("text")
      .filter((_, i, list) => i === 0 || i === list.length - 1)
      .style("visibility", "hidden");
  }

  function drawXAxis() {
    scrollableMasterGroup
      .append("g")
      .attr("class", "chart-grid")
      .attr("transform", `translate(${xLeftPadding}, ${0})`)
      .call(
        d3
          .axisTop(xScale)
          .ticks(data.length)
          .tickSize(-BAR_HEIGHT * 24)
          .tickSizeOuter(0)
          .tickFormat("")
      )
      .selectAll(".tick")
      .filter((_, i) => i === 0)
      .style("visibility", "hidden");

    const xAxisContainer = headerMasterGroup
      .append("g")
      .attr("class", "chart-axis x-axis");

    xAxisContainer
      .call(
        d3
          .axisTop(xScale)
          .ticks(data.length)
          .tickValues(data.map((d) => d.x))
          .tickFormat(d3.timeFormat("%d"))
          .tickSize(xAxisTickSize)
          .tickPadding(15)
      )
      .selectAll("text")
      .style("font-size", "26px")
      .attr("transform", `translate(${-barWidth / 2}, ${xAxisTickSize})`);

    xAxisContainer
      .selectChildren(".tick")
      .data(data)
      .append("text")
      .text((d) => d3.timeFormat("%a")(d.x))
      //  TODO take -50 from prop as topOffset
      .attr("transform", `translate(${-barWidth / 2}, ${-50})`)
      .style("font-size", "11px");

    const xAxisHeight = xAxisContainer.node().getBBox().height;

    xAxisContainer.attr(
      "transform",
      `translate(${xLeftPadding}, ${xAxisHeight})`
    );

    scrollableParent.style("max-height", `${height - xAxisHeight}px`);
    headerSvg.style("height", `${xAxisHeight}px`);
  }

  function getXScalePosition(xValue) {
    return xScale(moment(xValue).subtract(1, "day").toDate());
  }

  function getYScalePosition(yValue) {
    return yScale(yValue);
  }

  function getXBarPosition(xValue) {
    return (
      //  TODO: Replace 0.25 with barOffset from props;
      getXScalePosition(xValue) + (1 - xBarWidthPercentage) * barWidth * 0.25
    );
  }

  function getBarWidth() {
    return barWidth * xBarWidthPercentage;
  }

  function getBarHeight(data) {
    return (
      (BAR_HEIGHT * moment(data.end).diff(moment(data.start))) / 1000 / 60 / 60
    );
  }

  function addTextEllipsis() {
    const self = d3.select(this);
    let textLength = self.node().getComputedTextLength();
    let text = self.text();

    while (textLength > getBarWidth() - 2 * 5 && text.length > 0) {
      text = text.slice(0, -1);
      self.text(text + "...");
      textLength = self.node().getComputedTextLength();
    }
  }

  function calculateTextOffset({ start, end }) {
    return `translate(${5}, ${this.getBBox().height * 1})`;
  }

  let parentNode;

  function onMouseOver() {
    this.classList.add("active");

    parentNode
      .selectAll("g.item")
      .filter(function () {
        return !this.classList.contains("active");
      })
      .transition()
      .duration(1000)
      .attr("opacity", hideOpacity);
  }

  function onMouseOut() {
    parentNode
      .selectAll("g.item")
      .filter(function () {
        return !this.classList.contains("active");
      })
      .transition()
      .duration(1000)
      .attr("opacity", 1);

    this.classList.remove("active");
  }

  function drawBars() {
    parentNode = scrollableSvg
      .append("g")
      .attr("transform", `translate(${xLeftPadding}, ${0})`);

    parentNode
      .selectAll("g.bar")
      .data(data)
      .join("g")
      .attr("class", "bar")
      .attr("transform", (d) => `translate(${getXBarPosition(d.x)}, 0)`)
      .selectAll("g.item")
      .data(({ values }) => values)
      .join("g")
      .attr("class", "item")
      .attr("cursor", "pointer")
      .attr("opacity", 1)
      .attr("visibility", "visible");

    const items = parentNode.selectAll("g.item");

    if (hideOnHover) {
      items.on("mouseover", onMouseOver).on("mouseout", onMouseOut);
    }

    items
      .selectAll("rect")
      .data((d) => [d])
      .join("rect")
      .attr("y", (d) => getYScalePosition(d.start))
      .attr("width", getBarWidth())
      .attr("height", (d) => (animate ? 0 : getBarHeight(d)))
      .attr("rx", barBorderRadius)
      .attr("fill", (d) => d.color)
      .attr("stroke-width", 1)
      .attr("stroke", "#ffffff");

    items
      .selectAll("text")
      .data((d) => [d])
      .join("text")
      .attr("y", (d) => getYScalePosition(d.start))
      .text((d) => d.title)
      .style("fill", "#ffffff")
      .style("font-size", "12px")
      .attr("transform", calculateTextOffset)
      .each(addTextEllipsis);

    if (animate) {
      items
        .selectAll("rect")
        .transition()
        .duration(1000)
        .attr("height", (d) => getBarHeight(d));
    }
  }

  function drawCurrentMarker() {
    const filteredData = data.filter(({ x }) =>
      moment(x).isSame(moment(), "day")
    );
    if (filteredData.length === 0) {
      return;
    }
    const parentNode = scrollableMasterGroup
      .append("g")
      .attr("transform", `translate(${xLeftPadding}, ${0})`);

    const [{ x: markerXPosition }] = filteredData;

    parentNode
      .append("rect")
      .attr("x", getXScalePosition(markerXPosition))
      .attr("y", getYScalePosition(moment().toDate()))
      .attr("width", barWidth - xLeftPadding / data.length)
      .attr("height", currentMarkerHeight)
      .attr("fill", "#EA4334");

    parentNode
      .append("circle")
      .attr("cx", getXScalePosition(markerXPosition))
      .attr("cy", getYScalePosition(moment().toDate()))
      .attr("r", currentMarkerCircleRadius)
      .attr("fill", "#EA4334")
      .attr("transform", function () {
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

    window.addEventListener("resize", handleResize);

    return () => {
      window.removeEventListener("resize", handleResize);
      clearTimeout(timeout);
    };
  }, []);

  return width;
}

function GoogleCalendar({
  animate,
  data,
  xLeftPadding,
  xBarWidthPercentage,
  currentMarkerHeight,
  currentMarkerCircleRadius,
  barBorderRadius,
  xAxisTickSize,
  yAxisTickSize,
  hideOnHover,
  hideOpacity,
}) {
  const bodyRef = useRef(null);
  const width = useWindowWidthResize();

  useEffect(() => {
    drawChart(
      bodyRef.current,
      data,
      animate,
      xLeftPadding,
      xBarWidthPercentage,
      currentMarkerHeight,
      currentMarkerCircleRadius,
      barBorderRadius,
      xAxisTickSize,
      yAxisTickSize,
      hideOnHover,
      hideOpacity
    );
  }, [
    data,
    animate,
    xLeftPadding,
    xBarWidthPercentage,
    currentMarkerHeight,
    currentMarkerCircleRadius,
    barBorderRadius,
    xAxisTickSize,
    yAxisTickSize,
    width,
    hideOnHover,
    hideOpacity,
  ]);

  return <Chart ref={bodyRef} />;
}

GoogleCalendar.propTypes = {
  animate: PropTypes.bool,
  data: PropTypes.arrayOf(
    PropTypes.shape({
      x: PropTypes.instanceOf(Date),
      values: PropTypes.arrayOf(
        PropTypes.shape({
          start: PropTypes.instanceOf(Date),
          end: PropTypes.instanceOf(Date),
          color: PropTypes.string,
          title: PropTypes.string,
        })
      ),
    })
  ).isRequired,
  xLeftPadding: PropTypes.number,
  xBarWidthPercentage: PropTypes.number,
  currentMarkerHeight: PropTypes.number,
  currentMarkerCircleRadius: PropTypes.number,
  barBorderRadius: PropTypes.number,
  xAxisTickSize: PropTypes.number,
  yAxisTickSize: PropTypes.number,
  hideOnHover: PropTypes.bool,
  hideOpacity: PropTypes.number,
};

GoogleCalendar.defaultProps = {
  animate: false,
  xLeftPadding: 50,
  xBarWidthPercentage: 0.8,
  currentMarkerHeight: 2.5,
  currentMarkerCircleRadius: 6,
  barBorderRadius: 5,
  xAxisTickSize: 10,
  yAxisTickSize: 10,
  hideOnHover: false,
  hideOpacity: 0.25,
};

export default GoogleCalendar;
