const express = require('express');
const {v4: uuidv4} = require('uuid');

const app = express();

const receipts = {};

function InputError(message) {
  this.name = InputError;
  this.message = message;
  this.stack = (new Error()).stack;
}
InputError.prototype = new Error;

function processReceipt(receipt) {
  if(!receipt.retailer || typeof(receipt.retailer) != "string") {
    throw new InputError('receipt must include property retailer of type string')
  }
  if(!receipt.items || !Array.isArray(receipt.items)) {
    throw new InputError('receipt must include property items of type array')
  }

  let total = 0;
  // Calculate the total
  for(let item of receipt.items) {

    if(!item.shortDescription || typeof(item.shortDescription) != 'string') {
      throw new InputError('each item in receipt include property shortDescription of type string')
    }

    if(!item || !item.price || typeof(item.price) != "string") {
      throw new InputError('each item in receipt must include property price of type string')
    }
    const price = Number(item.price)
    if(isNaN(price)) {
      throw new InputError('property price of each item in receipt must represent a valid float value')
    }
    total += price;
    item.price = price;
  };
  total = total.toFixed(3);

  if(!receipt.total || typeof(receipt.total) != "string") {
    throw new InputError('receipt must include property total of type string');
  }
  let receiptTotal = Number(receipt.total);
  if(isNaN(receiptTotal)) {
    throw new InputError('property total must represent a valid float value');
  }
  if(total != receiptTotal) {
    throw new InputError('total value listed on receipt does not equal the sum of the price of each item on the receipt');
  }

  if(!receipt.purchaseDate || typeof(receipt.purchaseDate) != "string") {
    throw new InputError('receipt must include property purchaseDate of type string');
  }
  if(!receipt.purchaseTime || typeof(receipt.purchaseTime) != "string") {
    throw new InputError('receipt must include property purchaseTime of type string');
  }
  const timestamp = Date.parse(receipt.purchaseDate + "T" + receipt.purchaseTime);
  if(isNaN(timestamp)) {
    throw new InputError('property purchaseDate must represent a valid date and property purchaseTime must represent a valid time');
  }

  return {
    id: uuidv4(),
    retailer: receipt.retailer,
    purchaseTimestamp: timestamp,
    items: receipt.items,
    total: total
  };
}

function calculateReceiptPoints(receipt) {
  let points = 0;

  // One point for every alphanumeric character in the retailer name.
  points += Array.from(receipt.retailer).reduce((total, letter) => {
    if((letter >= 'a' && letter <= 'z') || (letter >= 'A' && letter <= 'Z') || (letter >= '0' && letter <= '9')) {
      return total + 1;
    }
    return total;
  }, 0);

  // Calculate the total
  for(let item of receipt.items) {
    // If the trimmed length of the item description is a multiple of 3, multiply the price by 0.2 and round up to the nearest integer. The result is the number of points earned.
    if(item.shortDescription && typeof(item.shortDescription) == 'string' && item.shortDescription.trim().length % 3 == 0) {
      points += Math.ceil(item.price * 0.2);
    }
  };

  const total = Number(receipt.total);

  // 50 points if the total is a round dollar amount with no cents.
  if(total % 1 == 0) {
    points += 50;
  }

  // 25 points if the total is a multiple of 0.25.
  if(total % 0.25 == 0) {
    points += 25;
  }

  // 5 points for every two items on the receipt.
  points += 5 * Math.floor(receipt.items.length / 2);

  // 6 points if the day in the purchase date is odd.
  const date = new Date(receipt.purchaseTimestamp);
  if(date.getDate() % 2 == 1) {
    points += 6;
  }

  // 10 points if the time of purchase is after 2:00pm and before 4:00pm.
  if(date.getHours() == 14 || date.getHours() == 15) {
    points += 10;
  }
  
  return points;
}

app.use(express.json());

app.post("/receipts/process", (req, res) => {
  try {
    const receipt = processReceipt(req.body);
    receipts[receipt.id] = receipt;
    res.status(201).json({id: receipt.id});
  } catch(error) {
    res.status(400).send(error.message);
  }
})

app.get("/receipts/:id/points", (req, res) => {
  const receipt = receipts[req.params.id];
  if(!receipt) {
    return res.sendStatus(404);
  }
  if(!receipt.points) {
    receipt.points = calculateReceiptPoints(receipt);
  }
  res.status(200).json({points: receipt.points});
})

app.use((err, req, res, next) => {
  if(res.headersSent) {
    next(err);
  }
  console.error(err);
  res.sendStatus(500);
})

app.listen(3000, () => {
  console.log(`Receipt processor server listening on port 3000`)
})