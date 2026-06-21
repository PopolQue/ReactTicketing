import React from 'react';
import { useParams } from 'react-router-dom';
export default function Followed() {
  const { type } = useParams();
  return (
    <div>
      <h1>Followed {type}</h1>
    </div>
  );
}
