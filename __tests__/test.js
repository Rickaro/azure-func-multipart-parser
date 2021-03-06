const fs = require('fs');
const path = require('path');

const { parse } = require('../src');

it('should parse a form with fields', () => {
  const bodyLines = [
    '--boundary',
    'Content-Disposition: form-data; name="name"',
    '',
    'Jon Snow',
    '--boundary',
    'Content-Disposition: form-data; name="age"',
    '',
    '23',
    '--boundary--',
    ''
  ];
  const request = {
    headers: {
      'Content-Type': 'multipart/form-data; boundary=boundary'
    },
    body: Buffer.from(bodyLines.join('\r\n'))
  };

  const { fields } = parse(request);
  expect(fields).toEqual({ name: 'Jon Snow', age: '23' });
});

it('should parse a form with a file#1', () => {
  const bodyLines = [
    '--boundary',
    'Content-Disposition: form-data; name="file"; filename="test.txt"',
    'Content-Type: text/plain; charset="utf-8"',
    '',
    'Jon Snow',
    '23',
    '--boundary--',
    ''
  ];
  const request = {
    headers: {
      'Content-Type': 'multipart/form-data; boundary=boundary'
    },
    body: Buffer.from(bodyLines.join('\r\n'))
  };

  const { files } = parse(request);
  const { file } = files;
  expect(file.filename).toEqual('test.txt');
  expect(file.type).toEqual('text/plain');
  expect(file.charset).toEqual('utf-8');
  expect(file.content.toString()).toEqual('Jon Snow\r\n23');
});

it('should parse a form with a file#2', () => {
  const fileBuffer = fs.readFileSync(path.join(__dirname, './_fixtures/test.xlsx'));
  const bodyLines = [
    '--boundary',
    'Content-Disposition: form-data; name="file"; filename="test.xlsx"',
    'Content-Type: application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
    'Content-Transfer-Encoding: base64',
    '',
    `${fileBuffer.toString('base64')}`,
    '--boundary--',
    ''
  ];
  const request = {
    headers: {
      'Content-Type': 'multipart/form-data; boundary=boundary'
    },
    body: Buffer.from(bodyLines.join('\r\n'))
  };

  const { files } = parse(request);
  const { file } = files;
  expect(file.filename).toEqual('test.xlsx');
  expect(file.type).toEqual('application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
  expect(file.encoding).toEqual('base64');
  // in the current version, the parser does not decode the content
  const buffer = Buffer.from(file.content.toString(), 'base64');
  expect(Buffer.compare(fileBuffer, buffer)).toEqual(0);
});

it('should parse a mixed form', () => {
  const bodyLines = [
    '--boundary',
    'Content-Disposition: form-data; name="name"',
    '',
    'Jon Snow',
    '--boundary',
    'Content-Disposition: form-data; name="file"; filename="test.txt"',
    'Content-Type: text/plain; charset="utf-8"',
    '',
    'Jon Snow',
    '23',
    '--boundary',
    'Content-Disposition: form-data; name="age"',
    '',
    '23',
    '--boundary--',
    ''
  ];
  const request = {
    headers: {
      'Content-Type': 'multipart/form-data; boundary=boundary'
    },
    body: Buffer.from(bodyLines.join('\r\n'))
  };

  const { fields, files } = parse(request);
  expect(fields).toEqual({ name: 'Jon Snow', age: '23' });

  const { file } = files;
  expect(file.filename).toEqual('test.txt');
  expect(file.type).toEqual('text/plain');
  expect(file.charset).toEqual('utf-8');
  expect(file.content.toString()).toEqual('Jon Snow\r\n23');
});
