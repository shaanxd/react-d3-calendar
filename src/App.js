import React, { useEffect, useState } from "react";
import styled, { css } from "styled-components";
import moment from "moment";
import { v4 } from "uuid";

import GoogleCalendar from "./GoogleCalendar";

const Container = styled.div`
  width: 100vw;
  height: 100%;
  padding: 2rem;
  box-sizing: border-box;
  display: flex;
  flex-direction: column;
`;

const CalendarContainer = styled.div`
  flex: 1;
`;

const HeaderContainer = styled.div`
  padding: 1rem;
  display: flex;
  justify-content: center;
  align-items: center;
`;

const PrimaryButton = styled.button`
  padding: 1rem;
  border-radius: 5px;
  border: none;
  color: #ffffff;
  background-color: #0099f3;
  font-size: 1rem;

  ${(props) =>
    props.circle &&
    css`
      height: 30px;
      width: 30px;
      margin: auto;
      display: flex;
      justify-content: center;
      align-items: center;
    `}

  ${(props) =>
    props.timeSelect &&
    css`
      margin-left: 0.5rem;
    `}

    ${({ selected }) =>
    selected &&
    css`
      border: 2px solid #0099f3;
      color: #0099f3;
      background-color: #ffffff;
    `}
`;

const WeekControllerContainer = styled.div`
  display: flex;
  margin-left: 0.5rem;
  background-color: #0099f3;
  border-radius: 5px;
  color: #ffffff;
  padding: 0rem 0.5rem;
`;

const PrimaryText = styled.span`
  padding: 1rem;
  margin: auto;
`;

const HeaderText = styled.span`
  margin-left: auto;
  font-size: 2rem;
  color: #0099f3;
`;

const CheckBoxContainer = styled.div`
  display: flex;
  margin-left: 1rem;
  padding: 1rem;
  border: 2px solid #0099f3;
  border-radius: 5px;
  color: #0099f3;
`;

const CheckBox = styled.input`
  margin-left: 0.5rem;
`;

const TYPE = {
  DAILY: "DAILY",
  WEEKLY: "WEEKLY",
  MONTHLY: "MONTHLY",
};
const TYPE_ARR = [
  {
    label: "Day",
    type: TYPE.DAILY,
    format: "Do [of] MMMM, YYYY",
  },
  {
    label: "Week",
    type: TYPE.WEEKLY,
    format: "[Week] W",
  },
  {
    label: "Month",
    type: TYPE.MONTHLY,
    format: "MMMM YYYY",
  },
];
const MINUTES = [0, 15, 30, 45];
const COLORS = ["#FF5605", "#88C147", "#0099F3", "#F0255D"];
const TASKS = [
  "Eat food",
  "Watch netflix",
  "Play games",
  "Sleep",
  "Never gonna give you up",
];

function getRandomInt(min, max) {
  return (
    Math.floor(Math.random() * (Math.floor(max) - Math.ceil(min) + 1)) +
    Math.ceil(min)
  );
}

function getRandomTimeStamp() {
  let start;
  let end;

  const first = moment()
    .set("hour", getRandomInt(0, 23))
    .set("minute", MINUTES[getRandomInt(0, MINUTES.length - 1)])
    .set("second", 0);
  const second = moment()
    .set("hour", getRandomInt(0, 23))
    .set("minute", MINUTES[getRandomInt(0, MINUTES.length - 1)])
    .set("second", 0);

  if (moment(first).isBefore(second)) {
    start = first.toDate();
    end = second.toDate();
  } else {
    start = second.toDate();
    end = first.toDate();
  }

  return {
    id: v4(),
    start,
    end,
    color: COLORS[getRandomInt(0, COLORS.length - 1)],
    title: `${moment(start).format("HH:mm")} - ${moment(end).format(
      "HH:mm"
    )} - ${TASKS[getRandomInt(0, TASKS.length - 1)]}`,
  };
}

function getMockData(today, type) {
  const data = [];

  let startDate;
  let numberOfDays;

  switch (type) {
    case TYPE.DAILY:
      startDate = moment(today);
      numberOfDays = 1;
      break;
    case TYPE.WEEKLY:
      startDate = moment(today).startOf("week");
      numberOfDays = 7;
      break;
    default:
      startDate = moment(today).startOf("month");
      numberOfDays = moment(today).daysInMonth();
  }

  for (let i = 0; i < numberOfDays; i += 1) {
    const date = moment(startDate).add(i, "day");

    const values = [getRandomTimeStamp(), getRandomTimeStamp()];
    data.push({
      x: date.toDate(),
      values: values.sort((a, b) => a.start.valueOf() - b.start.valueOf()),
    });
  }

  return data;
}

function App() {
  const [type, setType] = useState(TYPE.WEEKLY);
  const [current, setCurrentDate] = useState(new Date());
  const [data, setData] = useState([]);
  const [hideOnHover, setHideOnHover] = useState(false);
  const [animate, setAnimate] = useState(false);

  useEffect(() => {
    setData(getMockData(current, type));
  }, [current, type]);

  function generateNewData() {
    setData(getMockData(current, type));
  }

  function handleOnHideChange() {
    setHideOnHover(!hideOnHover);
  }

  function handleOnAnimateChange() {
    setAnimate(!animate);
  }

  function getSwitchType() {
    let switchType;
    switch (type) {
      case TYPE.DAILY:
        switchType = "day";
        break;
      case TYPE.WEEKLY:
        switchType = "week";
        break;
      default:
        switchType = "month";
    }
    return switchType;
  }

  function addWeek() {
    const switchType = getSwitchType();
    setCurrentDate(moment(current).add(1, switchType).toDate());
  }

  function reduceWeek() {
    const switchType = getSwitchType();
    setCurrentDate(moment(current).subtract(1, switchType).toDate());
  }

  const foundType = TYPE_ARR.find(({ type: val }) => val === type);

  return (
    <div className="App">
      <Container>
        <HeaderContainer>
          <PrimaryButton onClick={generateNewData}>Generate!</PrimaryButton>
          <CheckBoxContainer>
            Hide on hover
            <CheckBox
              type="checkbox"
              onChange={handleOnHideChange}
              value={hideOnHover}
            />
          </CheckBoxContainer>
          <CheckBoxContainer>
            Animate
            <CheckBox
              type="checkbox"
              onChange={handleOnAnimateChange}
              value={animate}
            />
          </CheckBoxContainer>
          <HeaderText>{moment(current).format(foundType.format)}</HeaderText>
          {TYPE_ARR.map(({ label, type: buttonType }) => (
            <PrimaryButton
              selected={buttonType === type}
              timeSelect
              onClick={() => {
                setType(buttonType);
              }}
            >
              {label}
            </PrimaryButton>
          ))}
          <WeekControllerContainer>
            <PrimaryButton circle onClick={reduceWeek}>
              -
            </PrimaryButton>
            <PrimaryText>{foundType.label}</PrimaryText>
            <PrimaryButton circle onClick={addWeek}>
              +
            </PrimaryButton>
          </WeekControllerContainer>
        </HeaderContainer>
        <CalendarContainer>
          <GoogleCalendar
            animate={animate}
            data={data}
            hideOnHover={hideOnHover}
          />
        </CalendarContainer>
      </Container>
    </div>
  );
}

export default App;
