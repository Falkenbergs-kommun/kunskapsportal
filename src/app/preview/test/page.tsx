export default function TestPage() {
  return (
    <div className="p-8 bg-blue-500 text-white">
      <h1 className="text-4xl font-bold mb-4">Tailwind CSS Test</h1>
      <p className="text-lg mb-4">If you can see this styled with blue background and white text, Tailwind is working!</p>
      <div className="bg-red-500 p-4 rounded-lg">
        <p>This should be red background</p>
      </div>
    </div>
  )
}