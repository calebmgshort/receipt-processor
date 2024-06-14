const express = require('express');
const {v4: uuidv4} = require('uuid');

const app = express();

const receipts = {};

function calculateReceiptPoints(receipt) {
  let points = 0;
  if(receipt.retailer && typeof(receipt.retailer) == "string") {
    // One point for every alphanumeric character in the retailer name.
    points += receipt.retailer.reduce((letter, total) => {
      if((letter >= 'a' && letter <= 'z') || (letter >= 'A' && letter <= 'Z') || (letter >= '0' && letter <= '9')) {
        return total + 1;
      }
      return total;
    }, 0);
  }
  let total = 0;
  if(receipt.items && Array.isArray(receipt.items)) {
    // 5 points for every two items on the receipt.
    points += 5 * Math.floor(receipt.items.length / 2);

    // Calculate the total
    total = receipt.items.reduce((item, total) => {
      if(!item || !item.price) {
        return total;
      }
      const price = Number(item.price)
      if(isNaN(price)) {
        return total;
      }

      // If the trimmed length of the item description is a multiple of 3, multiply the price by 0.2 and round up to the nearest integer. The result is the number of points earned.
      if(item.shortDescription && typeof(item.shortDescription) == 'string' && item.shortDescription.trim().length % 3 == 0) {
        points += Math.ceil(price * 0.2);
      }
      return total + price;
    }, 0);
  }
  // 50 points if the total is a round dollar amount with no cents.
  if(total % 1 == 0) {
    points += 50;
  }
  // 25 points if the total is a multiple of 0.25.
  if(total % 0.25 == 0) {
    points += 25;
  }

  // 6 points if the day in the purchase date is odd.
  if(receipt.purchaseDate) {
    const purchaseDate = Date.parse(receipt.purchaseDate);
    if(!isNaN(purchaseDate) && purchaseDate.getDate() % 2 == 1) {
      points += 6;
    }
  }

  // 10 points if the time of purchase is after 2:00pm and before 4:00pm.
  purchaseTimeIf:
  if(receipt.purchaseTime) {
    const times = purchaseTime.split(":")
    if(times.length != 2 && times.length != 3) {
      break purchaseTimeIf;
    }
    const hours = Number(times[0]);
    if(isNaN(hours)) {
      break purchaseTimeIf;
    }
    if(hours == 14 || hours == 15) {
      points += 10;
    }
  }
  return points;
}

app.use(express.json());

app.post("/receipts/process", (req, res) => {
  const input_receipt = req.body;
  const receipt = {
    id: uuidv4(),
    retailer: input_receipt.retailer,
    purchaseDate: input_receipt.purchaseDate,
    purchaseTime: input_receipt.purchaseTime,
    items: input_receipt.items
  };
  res.status(201).json({id: receipt.id});
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