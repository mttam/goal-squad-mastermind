import DataExtractor from '@/components/DataExtractor';

const DataExtractorPage = () => {
  return (
    <div className="container mx-auto p-4 space-y-6">
      <div className="text-center space-y-2">
        <h1 className="text-3xl font-bold text-[#333446]">Data Extractor 📊</h1>
        <p className="text-[#7F8CAA]">Extract, edit, and manage player statistics from formations</p>
      </div>
      <DataExtractor />
    </div>
  );
};

export default DataExtractorPage;
