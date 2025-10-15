document.addEventListener('DOMContentLoaded', () => {
  const footerHTML = `
    <footer class="bg-light text-center text-lg-start mt-auto py-4">
      <div class="container">
        <div class="row">
          <div class="col-lg-6 col-md-12 mb-4 mb-md-0">
            <h5 class="text-uppercase text-success">MealMender</h5>
            <p>Reducing food waste and fighting hunger by connecting communities.</p>
          </div>
        </div>
      </div>
      <div class="text-center p-3" style="background-color: rgba(0, 0, 0, 0.05);">
        2025 MealMender: All Rights Reserved.
      </div>
    </footer>
  `;
  document.body.insertAdjacentHTML('beforeend', footerHTML);
});