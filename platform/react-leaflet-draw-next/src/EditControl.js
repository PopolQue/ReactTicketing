import { PropTypes } from 'prop-types';
import 'leaflet-draw'; // eslint-disable-line
import isEqual from 'fast-deep-equal';
import React, { useRef } from 'react';
import { useMap } from 'react-leaflet';

import leaflet, { Map, Control } from 'leaflet';

const eventHandlers = {
  onEdited: 'draw:edited',
  onDrawStart: 'draw:drawstart',
  onDrawStop: 'draw:drawstop',
  onDrawVertex: 'draw:drawvertex',
  onEditStart: 'draw:editstart',
  onEditMove: 'draw:editmove',
  onEditResize: 'draw:editresize',
  onEditVertex: 'draw:editvertex',
  onEditStop: 'draw:editstop',
  onDeleted: 'draw:deleted',
  onDeleteStart: 'draw:deletestart',
  onDeleteStop: 'draw:deletestop',
};

function EditControl(props) {
  const map = useMap();
  const drawRef = useRef();
  const propsRef = useRef(props);

  function onDrawCreate(e) {
    const { onCreated, featureGroup } = props;
    if (featureGroup) {
      featureGroup.addLayer(e.layer);
    }
    onCreated && onCreated(e);
  }

  React.useEffect(() => {
    const { onMounted, featureGroup } = props;

    for (const key in eventHandlers) {
      if (Object.prototype.hasOwnProperty.call(eventHandlers, key)) {
        map.on(eventHandlers[key], (evt) => {
          let handlers = Object.keys(eventHandlers).filter(
            (handler) => eventHandlers[handler] === evt.type
          );
          if (handlers.length === 1) {
            let handler = handlers[0];
            props[handler] && props[handler](evt);
          }
        });
      }
    }
    map.on(leaflet.Draw.Event.CREATED, onDrawCreate);
    drawRef.current = createDrawElement(props, featureGroup);
    map.addControl(drawRef.current);
    onMounted && onMounted(drawRef.current);

    return () => {
      map.off(leaflet.Draw.Event.CREATED, onDrawCreate);

      for (const key in eventHandlers) {
        if (Object.prototype.hasOwnProperty.call(eventHandlers, key) && props[key]) {
          map.off(eventHandlers[key], props[key]);
        }
      }

      if (drawRef.current) {
        drawRef.current.remove(map);
      }
    };
  }, [props.onCreated, props.onDeleted, props.onEdited, props.featureGroup]);

  React.useEffect(() => {
    if (
      isEqual(props.draw, propsRef.current.draw) &&
      isEqual(props.edit, propsRef.current.edit) &&
      props.position === propsRef.current.position &&
      props.featureGroup === propsRef.current.featureGroup
    ) {
      return undefined;
    }

    drawRef.current.remove(map);
    drawRef.current = createDrawElement(props, props.featureGroup);
    drawRef.current.addTo(map);

    const { onMounted } = props;
    onMounted && onMounted(drawRef.current);

    return () => {
      if (drawRef.current) {
        drawRef.current.remove(map);
      }
    };
  }, [
    props.draw, 
    props.edit, 
    props.position, 
    props.featureGroup,
    props.onCreated,
    props.onDeleted,
    props.onEdited
  ]);

  return null;
}

function createDrawElement(props, featureGroup) {
  const { draw, edit, position } = props;
  const options = {
    edit: {
      ...edit,
      featureGroup: featureGroup,
    },
  };

  if (draw) {
    options.draw = { ...draw };
  }

  if (position) {
    options.position = position;
  }

  return new Control.Draw(options);
}

EditControl.propTypes = {
  ...Object.keys(eventHandlers).reduce((acc, val) => {
    acc[val] = PropTypes.func;
    return acc;
  }, {}),
  onCreated: PropTypes.func,
  onMounted: PropTypes.func,
  draw: PropTypes.shape({
    polyline: PropTypes.oneOfType([PropTypes.object, PropTypes.bool]),
    polygon: PropTypes.oneOfType([PropTypes.object, PropTypes.bool]),
    rectangle: PropTypes.oneOfType([PropTypes.object, PropTypes.bool]),
    circle: PropTypes.oneOfType([PropTypes.object, PropTypes.bool]),
    marker: PropTypes.oneOfType([PropTypes.object, PropTypes.bool]),
  }),
  edit: PropTypes.shape({
    edit: PropTypes.oneOfType([PropTypes.object, PropTypes.bool]),
    remove: PropTypes.oneOfType([PropTypes.object, PropTypes.bool]),
    poly: PropTypes.oneOfType([PropTypes.object, PropTypes.bool]),
    allowIntersection: PropTypes.bool,
  }),
  position: PropTypes.oneOf([
    'topright',
    'topleft',
    'bottomright',
    'bottomleft',
  ]),
  featureGroup: PropTypes.object, // L.FeatureGroup instance
};

export default EditControl;
