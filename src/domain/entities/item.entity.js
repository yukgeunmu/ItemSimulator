export class Item {
  constructor(props) {
    this.itemId = props.itemId;
    this.name = props.itemName;
    this.stat = props.itemStat;
    this.price = props.itemPrice;
    this.isEquippable = props.isEquip;
    this.type = props.itemType;
  }

}
