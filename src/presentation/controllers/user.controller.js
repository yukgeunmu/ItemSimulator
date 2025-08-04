export class UserController {
  constructor(userService) {
    this.userService = userService;
  }

  signUp = async (req, res, next) => {
    try {
      const user = await this.userService.signUp(req.body);
      res.status(201).json(user);
    } catch (error) {
      next(error);
    }
  };

  signIn = async (req, res, next) => {
    try {
      const tokens = await this.userService.signIn(req.body);
      res.status(200).json(tokens);
    } catch (error) {
      next(error);
    }
  };
}
