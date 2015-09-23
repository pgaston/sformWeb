using System;
using System.Web.Services;
using System.Configuration;
using System.Web.Script.Services;
using System.Web.Script.Serialization;
using System.Data.SqlClient;

namespace sformWeb
{
    // Return message format (JSON)
    public class jMessage
    {
        public int doWhat { get; set; }              // 1=get, 2=set (all for now)
        public Guid sessionId { get; set; }          // GUID
        public object payload { get; set; }          // JSON of the full payload - for save

        // For returning
        public int iResult { get; set; }             // 0=good, 1=bad
        public string errMessage { get; set; }
    }



    /// <summary>
    /// Summary description for WebService
    /// </summary>
    [WebService(Namespace = "http://www.sform.azurewebsites.net/")]
    [WebServiceBinding(ConformsTo = WsiProfiles.BasicProfile1_1)]
//    [System.ComponentModel.ToolboxItem(false)]
    // To allow this Web Service to be called from script, using ASP.NET AJAX, uncomment the following line. 
    [ScriptService]
    public class WebService : System.Web.Services.WebService
    {
        private string connectString;
        private JavaScriptSerializer js;

        public WebService()
        {
            connectString = ConfigurationManager.ConnectionStrings["MyDB"].ToString();
            js = new JavaScriptSerializer();
        }

        [WebMethod]
        [ScriptMethod(ResponseFormat = ResponseFormat.Json)]
        public void ep(int doWhat, string sessionId, object payload)
        {
            Context.Response.Clear();
            Context.Response.ContentType = "application/json";
            jMessage jOut = new jMessage();
            jOut.doWhat = doWhat;

            try
            {
                using (SqlConnection dbConn = new SqlConnection(connectString))
                {
                    dbConn.Open();

                    if (doWhat == 1)           // get - return the payload
                    {
                        using (SqlCommand sqlComm = new SqlCommand("SELECT payload FROM payloads WHERE (sessId=@sessId)", dbConn))
                        {
                            Guid sessId = new Guid(sessionId);      // parse
                            sqlComm.Parameters.Add(new SqlParameter("sessId", sessId));
                            string aJ = (string)sqlComm.ExecuteScalar();
                            jOut.payload = js.DeserializeObject(aJ);
                        }
                    }
                    else if (doWhat == 2)      // set - save the payload, return the sessionId accompanying this payload
                    {
                        string aJ = js.Serialize(payload);
                        if (sessionId.Trim().Length > 0)
                        {
                            jOut.sessionId = new Guid(sessionId);        // update to this existing session id
                            using (SqlCommand sqlComm = new SqlCommand("UPDATE payloads SET payload=@payload WHERE sessId=@sessId", dbConn))
                            {
                                sqlComm.Parameters.Add(new SqlParameter("sessId", jOut.sessionId));
                                sqlComm.Parameters.Add(new SqlParameter("payload", aJ));
                                sqlComm.ExecuteNonQuery();
                            }
                        }
                        else
                        {
                            jOut.sessionId = Guid.NewGuid();            // create new entry, new sessionId
                            using (SqlCommand sqlComm = new SqlCommand("INSERT INTO payloads (sessId,payload) VALUES (@sessId,@payload)", dbConn))
                            {
                                sqlComm.Parameters.Add(new SqlParameter("sessId", jOut.sessionId));
                                sqlComm.Parameters.Add(new SqlParameter("payload", aJ));
                                sqlComm.ExecuteNonQuery();
                            }
                        }
                    }
                    else
                    {
                        jOut.iResult = -1;   // bad parameter
                        jOut.errMessage = "Unknown end point direction";
                    }
                }
            }
            catch (Exception err)
            {
                jOut.errMessage = err.Message;
                jOut.iResult = -2;   // tragic error
            }

            Context.Response.Write(js.Serialize(jOut));
            Context.Response.Flush();
            Context.Response.Close();       // needed, else a {d:null} gets appended - go figure?
        }


        // TESTING
        // TESTING
        // TESTING
        // TESTING
        // TESTING

        [WebMethod]
        [ScriptMethod(UseHttpGet = true, ResponseFormat = ResponseFormat.Json)]
        public string HelloWorld()
        {
            return "Hello World";
        }
    }
}
