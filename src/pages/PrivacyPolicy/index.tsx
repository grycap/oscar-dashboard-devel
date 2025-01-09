import { Link } from "react-router-dom";

export function PrivacyPolicy() {
  const privacyData = [
    { category: "Name of the service", details: "OSCAR" },
    {
      category: "URLs of the service",
      details: "https://ui.oscar.grycap.net/",
    },
    {
      category: "Description of the service",
      details:
        "OSCAR is an open-source platform to support the Functions as a Service (FaaS) computing model for file-processing applications. It can be automatically deployed on multi-Clouds in order to create highly-parallel event-driven file-processing serverless applications that execute on customized runtime environments provided by Docker containers than run on an elastic Kubernetes cluster.",
    },
    {
      category: "Data controller",
      details:
        "Grupo de Grid y Computación de Altas Prestaciones (GRyCAP) de la Universitat Politècnica de València (UPV): Universitat Politècnica de València Camino de Vera s/n Edificio 8B, Acc. N, Nivel 1. GRyCAP Valencia, Valencia 46022 Spain\nemail: products@grycap.upv.es",
    },
    { category: "Jurisdiction", details: "ES.Spain (Valencia)" },
    { category: "Personal data processed", details: "None" },
    { category: "Purpose of the processing of personal data", details: "None" },
    {
      category: "Third parties to whom personal data is disclosed",
      details: "None",
    },
    {
      category: "How to access, rectify and delete the personal data",
      details:
        "Contact the email: products@grycap.upv.es. To rectify the data released by your Home Organisation, contact your Home Organisation's IT helpdesk",
    },
    { category: "Data retention", details: "No personal data is retained" },
    {
      category: "Data Protection Code of Conduct",
      details: (
        <>
          Your personal data, if any, will be protected according to the{" "}
          <Link
            to="http://www.geant.net/uri/dataprotection-code-of-conduct/v1"
            target="_blank"
            rel="noopener noreferrer"
            className="text-blue-500"
          >
            Code of Conduct for Service Providers
          </Link>
          , a common standard for the research and higher education sector to
          protect your privacy
        </>
      ),
    },
    {
      category: "Cookies",
      details: (
        <>
          This site uses an internal cookie only to maintain user sessions with
          the server. Our website uses Google Analytics. For more information
          about privacy at Google Analytics, please see{" "}
          <Link
            to="https://policies.google.com/privacy"
            target="_blank"
            rel="noopener noreferrer"
            className="text-blue-500"
          >
            Google's privacy policy
          </Link>
          . You can prevent the collection of the data generated by the cookie
          and transmission to Google by modifying the Cookies Consent.
        </>
      ),
    },
  ];

  return (
    <div className="container mx-auto px-4 py-8 overflow-auto max-h-screen">
      <h1 className="text-3xl font-bold mb-6">Privacy Policy for OSCAR</h1>
      <div className="overflow-x-auto">
        <table className="min-w-full bg-white border border-gray-300">
          <thead>
            <tr className="bg-gray-100">
              <th className="py-2 px-4 border-b text-left">Category</th>
              <th className="py-2 px-4 border-b text-left">Details</th>
            </tr>
          </thead>
          <tbody>
            {privacyData.map((item, index) => (
              <tr
                key={index}
                className={index % 2 === 0 ? "bg-gray-50" : "bg-white"}
              >
                <td className="py-2 px-4 border-b font-medium">
                  {item.category}
                </td>
                <td className="py-2 px-4 border-b whitespace-pre-wrap">
                  {item.details}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
