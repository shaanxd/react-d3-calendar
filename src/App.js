import React, { useState } from 'react';
import styled from 'styled-components';
import moment from 'moment';

import GoogleCalendar from './GoogleCalendar';

const Container = styled.div`
  width: 100vw;
  height: 100vh;
  padding: 2rem;
  box-sizing: border-box;
  display: flex;
  flex-direction: column;
`;

const CalendarContainer = styled.div`
  flex: 1;
`;

const HeaderContainer = styled.div`
  width: 100%;
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
`;

const MINUTES = [0, 15, 30, 45];
const COLORS = ['#FF5605', '#88C147', '#0099F3', '#F0255D'];

function getRandomInt(min, max) {
  return (
    Math.floor(Math.random() * (Math.floor(max) - Math.ceil(min) + 1)) +
    Math.ceil(min)
  );
}

function getMockData(today) {
  const data = [];
  const startOfWeek = moment(today).startOf('week');

  for (let i = 0; i < 7; i += 1) {
    const date = moment(startOfWeek).add(i, 'day');
    let start;
    let end;

    const first = moment()
      .set('hour', getRandomInt(0, 23))
      .set('minute', MINUTES[getRandomInt(0, MINUTES.length - 1)])
      .set('second', 0);
    const second = moment()
      .set('hour', getRandomInt(0, 23))
      .set('minute', MINUTES[getRandomInt(0, MINUTES.length - 1)])
      .set('second', 0);

    if (moment(first).isBefore(second)) {
      start = first.toDate();
      end = second.toDate();
    } else {
      start = second.toDate();
      end = first.toDate();
    }

    data.push({
      title: `Day ${i + 1}`,
      x: date.toDate(),
      values: {
        start,
        end,
      },
      color: COLORS[getRandomInt(0, COLORS.length - 1)],
    });
  }

  return data;
}

function App() {
  const [current, setCurrentDate] = useState(new Date());
  const [data, setData] = useState(getMockData(current));

  function generateNewData() {
    setData(getMockData(current));
  }

  return (
    <div className='App'>
      <Container>
        <HeaderContainer>
          <PrimaryButton onClick={generateNewData}>Generate!</PrimaryButton>
        </HeaderContainer>
        <CalendarContainer>
          <GoogleCalendar animate data={data} />
        </CalendarContainer>
      </Container>
    </div>
  );
}

export default App;
