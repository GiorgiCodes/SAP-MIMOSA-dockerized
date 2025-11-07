var builder = WebApplication.CreateBuilder(args);

// Read the FastAPI backend URL from environment variable (set in docker-compose.yml)
var fastApiUrl = Environment.GetEnvironmentVariable("PYTHON_API_URL")
                ?? "http://localhost:8000/"; // fallback for local dev

// Add services to the container.
builder.Services.AddControllersWithViews();

// Add and configure HttpClient for the FastAPI backend
builder.Services.AddHttpClient("FastAPIClient", client =>
{
    client.BaseAddress = new Uri(fastApiUrl);
    client.Timeout = TimeSpan.FromMinutes(5);
    client.DefaultRequestHeaders.Add("Accept", "application/json");
});

var app = builder.Build();

// Configure the HTTP request pipeline.
if (!app.Environment.IsDevelopment())
{
    app.UseExceptionHandler("/Home/Error");    
    app.UseHsts();
}

app.UseHttpsRedirection();
app.UseStaticFiles();

app.UseRouting();
app.UseAuthorization();

app.MapControllerRoute(
    name: "default",
    pattern: "{controller=Home}/{action=Index}/{id?}");

app.Run();
