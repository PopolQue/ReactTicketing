import * as React from 'react';
import 'leaflet-draw';
import type {
	DrawOptions,
	Control,
	ControlPosition,
	DrawEvents,
} from 'leaflet';
import * as L from 'leaflet';

/**
 * Props interface for the EditControl component
 */
interface EditControlProps {
	/** Callback fired when features are edited */
	onEdited?: (v: DrawEvents.Edited) => void;
	/** Callback fired when drawing starts */
	onDrawStart?: (v: DrawEvents.DrawStart) => void;
	/** Callback fired when drawing stops */
	onDrawStop?: (v: DrawEvents.DrawStop) => void;
	/** Callback fired when a vertex is drawn */
	onDrawVertex?: (v: DrawEvents.DrawVertex) => void;
	/** Callback fired when editing starts */
	onEditStart?: (v: DrawEvents.EditStart) => void;
	/** Callback fired when features are moved during editing */
	onEditMove?: (v: DrawEvents.EditMove) => void;
	/** Callback fired when features are resized during editing */
	onEditResize?: (v: DrawEvents.EditResize) => void;
	/** Callback fired when a vertex is edited */
	onEditVertex?: (v: DrawEvents.EditVertex) => void;
	/** Callback fired when editing stops */
	onEditStop?: (v: DrawEvents.EditStop) => void;
	/** Callback fired when features are deleted */
	onDeleted?: (v: DrawEvents.Deleted) => void;
	/** Callback fired when deletion starts */
	onDeleteStart?: (v: DrawEvents.DeleteStart) => void;
	/** Callback fired when deletion stops */
	onDeleteStop?: (v: DrawEvents.DeleteStop) => void;
	/** Callback fired when new features are created */
	onCreated?: (v: DrawEvents.Created) => void;
	/** Callback fired when the control is mounted */
	onMounted?: Function;
	/** Edit options for the control */
	edit?: Control.EditOptions;
	/** Draw options for different shape types */
	draw: {
		/** Polyline drawing options */
		polyline?: DrawOptions.PolylineOptions | boolean;
		/** Polygon drawing options */
		polygon?: DrawOptions.PolygonOptions | boolean;
		/** Rectangle drawing options */
		rectangle?: DrawOptions.RectangleOptions | boolean;
		/** Circle drawing options */
		circle?: DrawOptions.CircleOptions | boolean;
		/** Marker drawing options */
		marker?: DrawOptions.MarkerOptions | boolean;
		/** Circle marker drawing options */
		circlemarker?: DrawOptions.CircleOptions | boolean;
	};
	/** Position of the control on the map */
	position: ControlPosition;
	/** Feature group to manage drawn features */
	featureGroup?: L.FeatureGroup;
}

export class EditControl extends React.Component<EditControlProps> {}
