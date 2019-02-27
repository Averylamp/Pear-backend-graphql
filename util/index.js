export const prepare = (o) => {
  if (o._id != null) {
    o._id = o._id.toString();
  }
  return o;
};
