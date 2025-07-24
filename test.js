
const str = "Abcd1efg";

const IsValidInput =  (str) =>{
  const regex = /^[a-z0-9]+$/;
  return regex.test(str);
};

console.log(IsValidInput(str));

console.log(str.length);