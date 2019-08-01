// Sort orders always start at the current time as unix time is what
// the system uses internally (so it can easily sort things without
// depending on a sequential sort order). Here we need to guarantee a
// sequential order since multiple transactions could easily be
// generated within a millisecond. It may seem weird, but guaranteeing
// uniqueness is easy within the same script but hard across multiple
// runs. Timestamps can be generated with no dependencies.
let _sortOrder = Date.now();
function nextSortOrder() {
  // Space them out by 10 to give the system internally some room
  // between them
  return _sortOrder + 10;
}

function updateSortOrders(transactions) {
  // This represents a transaction with subtransactions, given as a
  // single array. These should always be grouped together, and are
  // given a descending sort order that is a fraction. Since sort
  // orders are integers by default, this ensures that we will always
  // appear "in between" other transactions
  //
  // Note that if the "parent" transaction doesn't already have a sort
  // order, it will be given a fresh one.
  const sortOrder = transactions[0].sort_order || nextSortOrder();
  transactions.forEach((transaction, idx) => {
    transaction.sort_order = sortOrder - idx / 100;
  });
}

function makeChildTransaction(parent, data) {
  return {
    ...data,
    id: data.id ? data.id : parent.id + '/' + uuid.v4Sync(),
    acct: parent.acct,
    date: parent.date,
    starting_balance_flag: parent.starting_balance_flag,
    isChild: true
  };
}

module.exports = { updateSortOrders, makeChildTransaction };
