const postXml = async (xml) => {
  const res = await fetch("http://localhost:9000", {
    method: "POST",
    headers: { "Content-Type": "text/xml" },
    body: xml
  });
  return res.text();
};

async function main() {
  const dates = [
    { label: "1st of Sept 2026 (20260901)", date: "20260901" },
    { label: "2nd of Sept 2026 (20260902)", date: "20260902" },
    { label: "1st of April 2024 (20240401)", date: "20240401" },
    { label: "1st of April 2025 (20250401)", date: "20250401" },
    { label: "1st of April 2026 (20260401)", date: "20260401" }
  ];

  for (const d of dates) {
    const xml = `<ENVELOPE>
  <HEADER>
    <TALLYREQUEST>Import Data</TALLYREQUEST>
  </HEADER>
  <BODY>
    <IMPORTDATA>
      <REQUESTDESC>
        <REPORTNAME>Vouchers</REPORTNAME>
      </REQUESTDESC>
      <REQUESTDATA>
        <TALLYMESSAGE xmlns:UDF="TallyUDF">
          <VOUCHER VCHTYPE="Journal" ACTION="Create">
            <VOUCHERTYPENAME>Journal</VOUCHERTYPENAME>
            <DATE>${d.date}</DATE>
            <EFFECTIVEDATE>${d.date}</EFFECTIVEDATE>
            <VOUCHERNUMBER>JV-${d.date}</VOUCHERNUMBER>
            <NARRATION>Educational Mode Date Test</NARRATION>
            <ALLLEDGERENTRIES.LIST>
              <LEDGERNAME>shan</LEDGERNAME>
              <ISDEEMEDPOSITIVE>YES</ISDEEMEDPOSITIVE>
              <AMOUNT>-100.00</AMOUNT>
            </ALLLEDGERENTRIES.LIST>
            <ALLLEDGERENTRIES.LIST>
              <LEDGERNAME>Shailaja Maickelraj</LEDGERNAME>
              <ISDEEMEDPOSITIVE>NO</ISDEEMEDPOSITIVE>
              <AMOUNT>100.00</AMOUNT>
            </ALLLEDGERENTRIES.LIST>
          </VOUCHER>
        </TALLYMESSAGE>
      </REQUESTDATA>
    </IMPORTDATA>
  </BODY>
</ENVELOPE>`;

    console.log("=========================================");
    console.log("Testing date:", d.label);
    const resp = await postXml(xml);
    console.log(resp);
  }
}

main();
