import { useLayoutEffect, useMemo, useRef, useState } from "react";
import "./StackedBarPlot.css";
import * as d3 from "d3";

const MARGIN = { top: 30, right: 30, bottom: 50, left: 50 };
const colors = ["#9a9a9a", "var(--secondary-color)", "#6689c6", "#9a6fb0", "#a53253"];
// type Group = {
//   x: string;
// } & { [key: string]: number };

type Group = {
  x: string;
} & { [key: string]: any };

type StackedBarPlotProps = {
  width: number;
  height: number;
  data: Group[];
  onBarClick?: (data: { [key: string]: number | string }) => void;
  selectedBar?: string;
};

export const StackedBarPlot = ({
  width,
  height,
  data,
  onBarClick,
  selectedBar
}: StackedBarPlotProps) => {
  // bounds = area inside the graph axis = calculated by substracting the margins
  const axesRef = useRef(null);

  //States
  const [showBarInfo, setShowBarInfo] = useState<boolean>(false);
  const [barInfoTopPosition, setBarInfoTopPosition] = useState<number>(0);
  const [barInfoLeftPosition, setBarInfoLeftPosition] = useState<number>(0);
  const [popUpData, setPopUpData] = useState<{ [key: string]: number | string }>({});

  const boundsWidth = width - MARGIN.right - MARGIN.left;
  const boundsHeight = height - MARGIN.top - MARGIN.bottom;

  const allGroups = data.map((d) => String(d.x));
  const allSubgroups = new Set([...data.map((d) => Object.keys(d).slice(1)).flat()]);

  // Data Wrangling: stack the data
  const stackSeries = d3.stack().keys(allSubgroups).order(d3.stackOrderNone);
  //.offset(d3.stackOffsetNone);
  const series = stackSeries(data);

  // Y axis
  const max = d3.max(
    data
      .map((subgrupo) =>
        Object.values(subgrupo)
          .slice(1)
          .reduce((acc, cur) => acc + cur)
      )
      .flat()
  );
  const yScale = useMemo(() => {
    return d3.scaleLinear().domain([0, max]).range([boundsHeight, 0]);
  }, [boundsHeight, max]);

  // X axis
  const xScale = useMemo(() => {
    return d3.scaleBand<string>().domain(allGroups).range([0, boundsWidth]).padding(0.05);
  }, [allGroups, boundsWidth]);

  // Color Scale
  // var colorScale = d3
  //   .scaleOrdinal<string>()
  //   .domain(allGroups)
  //   .range([
  //     "#dimgray",
  //     "#var(--secondary-color)",
  //     "#6689c6",
  //     "#9a6fb0",
  //     "#a53253",
  //   ]);

  // Render the X and Y axis using d3.js, not react
  useLayoutEffect(() => {
    const svgElement = d3.select(axesRef.current);
    svgElement.selectAll("*").remove();
    const yAxisGenerator = d3.axisLeft(yScale);
    svgElement.append("g").call(yAxisGenerator);
    const xAxisGenerator = d3.axisBottom(xScale);
    svgElement
      .append("g")
      .attr("transform", "translate(0," + boundsHeight + ")")
      .call(xAxisGenerator)
      .selectAll("text")
      .style("text-anchor", "end")
      .style("font-size", "8px")
      // .attr("dx", "-.8em")
      // .attr("dy", ".15em")
      .attr("font-size", 8);
  }, [xScale, yScale, boundsHeight]);
  const rectangles = series.map((subgroup, i) => {
    return (
      <g key={i}>
        {subgroup.map((group, j) => {
          return (
            <rect
              key={j}
              className={selectedBar === String(group.data.x) ? "bar-stacked-bar-plot-selected" : "bar-stacked-bar-plot"}
              x={xScale(String(group.data.x))}
              y={yScale(group[1])}
              height={Math.abs(yScale(group[0]) - yScale(group[1]))}
              width={xScale.bandwidth()}
              fill={colors[i]}
              opacity={0.8}
              onClick={() => {
                if (onBarClick) onBarClick(group.data);
              }}
              onMouseEnter={() => {
                setPopUpData(group.data);
              }}
              onMouseMove={(event) => {
                setShowBarInfo(true);
                setBarInfoLeftPosition(event.clientX + 15);
                setBarInfoTopPosition(event.clientY);
              }}
              onMouseLeave={() => {
                setShowBarInfo(false);
                setPopUpData({});
              }}
            ></rect>
          );
        })}
        {/* <text
            // transform={`rotate(${rotacionEtiquetas})`}
            alignmentBaseline="central"
            dominant-baseline="middle"
            text-anchor="end"
            fontSize={8}
          >
            {allGroups[i]}
          </text> */}
      </g>
    );
  });
  return (
    <div className="stacked-bar-plot">
      <svg width={Math.abs(width)} height={Math.abs(height)}>
        <g
          width={boundsWidth}
          height={boundsHeight}
          transform={`translate(${[MARGIN.left, MARGIN.top].join(",")})`}
        >
          {rectangles}
        </g>
        <g
          width={boundsWidth}
          height={boundsHeight}
          ref={axesRef}
          transform={`translate(${[MARGIN.left, MARGIN.top].join(",")})`}
        />
      </svg>
      {showBarInfo && (
        <div
          className="pop-up-info-hovering-bar"
          style={{
            position: "fixed",
            top: barInfoTopPosition,
            left: barInfoLeftPosition,
          }}
        >
          {popUpData.x && <p>{popUpData.x}</p>}
          {Object.entries(popUpData)
            .slice(1)
            .map((entry) => (
              <p key={entry[0]}>
                {entry[0]}: {Number(entry[1]).toFixed(0)}
              </p>
            ))}
        </div>
      )}
    </div>
  );
};
