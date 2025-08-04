export class Character {
  constructor(props) {
    this.characterId = props.characterId;
    this.accountId = props.accountId;
    this.charactername = props.charactername;
    this.health = props.health;
    this.power = props.power;
    this.money = props.money;
    this.profileImage = props.profileImage;
    this.createAt = props.createAt;
    this.updateAt = props.updateAt;
  }

  buyItem(item){
    if(item.price > this.money){
        throw new Error('소지금이 부족합니다.');
    }
    this.money -=item.price;
  }

  sellItem(item){
    this.money +=item*0.6;
  }
  
}
