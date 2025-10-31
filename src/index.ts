import app from '../src/app/server';

const port = 3000;

app.listen(port, () => {
  console.log(`Server is running on port ${port}`);
}); 