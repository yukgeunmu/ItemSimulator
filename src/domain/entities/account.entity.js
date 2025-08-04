export class User {
  constructor(props) {
    this.accountId = props.accountId;
    this.userId = props.userId;
    this.password = props.password;
    this.name = props.name;
    this.createAt = props.createAt;
    this.updatedAt = props.updatedAt;
    this.refreshToken = props.refreshToken;
  }

  withoutPassword(){
    this.password = undefined;
    return this;
  }

  validata(){
    if(!this.userId || !this.name){
        throw new Error('User ID와 이름은 필수입니다.');
    }
  }
}
