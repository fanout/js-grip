import { Buffer } from 'buffer';
import Grip, * as GripProps from './main.mjs';
export default Grip;

Object.assign(Grip, GripProps, { Buffer });
