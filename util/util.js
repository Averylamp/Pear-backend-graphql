export const rollbackObject = async ({
  model, object_id, initialObject, onSuccess, onFailure,
}) => (model.findByIdAndUpdate(object_id, initialObject, {
  new: true,
  overwrite: true,
})
  .exec()
  .then(onSuccess)
  .catch(onFailure)
);
