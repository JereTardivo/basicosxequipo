export default function NotFound() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-900 text-white p-6">
      <div className="text-center">
        <h1 className="text-6xl font-bold text-red-500 mb-4">404</h1>
        <h2 className="text-2xl font-semibold mb-2">Página no encontrada</h2>
        <p className="text-gray-400 mb-6">La página que estás buscando no existe o fue movida.</p>
        <a href="/" className="bg-green-600 hover:bg-green-700 text-white font-bold py-2 px-4 rounded">
          Volver al inicio
        </a>
      </div>
    </div>
  );
}