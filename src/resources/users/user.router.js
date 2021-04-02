const mongoose = require('mongoose');
const Grid = require('gridfs-stream');

const { OK, NO_CONTENT, BAD_REQUEST } = require('http-status-codes');
const router = require('express').Router();

const userService = require('./user.service');
const { uploadFilesMiddleware } = require('../../utils/fileMiddleware');
const { id, user } = require('../../utils/validation/schemas');
const {
  validator,
  userIdValidator
} = require('../../utils/validation/validator');

const db = mongoose.connection;
let gfs;
db.once('open', () => {
  gfs = Grid(db.db, mongoose.mongo);
  gfs.collection('photos');
});

router.post(
  '/',
  [uploadFilesMiddleware, validator(user, 'body')],
  async (req, res) => {
    try {
      const userModel = {
        name: req.body.name,
        email: req.body.email,
        password: req.body.password
      };
      await uploadFilesMiddleware(req, res);
      if (req.file && req.file.filename) {
        userModel.photoFileName = req.file.filename;
      }
      const userEntity = await userService.save(userModel);
      res.status(OK).send(userEntity.toResponse());
    } catch (error) {
      console.log(error);
      res.status(BAD_REQUEST).send(`Error during creating of user: ${error}`);
    }
  }
);

router.route('/photo').get(async (req, res) => {
  try {
    gfs.files.findOne({ filename: req.query.filename }, (err, file) => {
      // check if files exist
      if (!file || file.length === 0) {
        return res.status(404).json({
          err: 'No files exist'
        });
      }
      const readStream = gfs.createReadStream(file.filename);
      readStream.pipe(res);
      res.status(200).contentType('image/jpeg');
    });
  } catch (error) {
    console.log(error);
    res.status(BAD_REQUEST).send(`${error}`);
  }
});

router
  .route('/:id')
  .get(userIdValidator, validator(id, 'params'), async (req, res) => {
    const userEntity = await userService.get(req.params.id);
    res.status(OK).send(userEntity.toResponse());
  });

router.put(
  '/:id',
  userIdValidator,
  validator(id, 'params'),
  validator(user, 'body'),
  async (req, res) => {
    const userEntity = await userService.update(req.userId, req.body);
    res.status(OK).send(userEntity.toResponse());
  }
);

router.delete(
  '/:id',
  userIdValidator,
  validator(id, 'params'),
  async (req, res) => {
    await userService.remove(req.params.id);
    res.sendStatus(NO_CONTENT);
  }
);

module.exports = router;
