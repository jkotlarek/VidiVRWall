using System.Collections.Generic;
using System.IO;
using System.Linq;
using System.Text.RegularExpressions;
using UnityEngine;

/// <summary>
/// Represents a single row of data from CSV file
/// </summary>
public class Event
{
    public Dictionary<string, string> values;

    public Event()
    {
        values = new Dictionary<string, string>();
    }
}

/// <summary>
/// Parses CSV file
/// </summary>
public class CSVHelper : List<string[]>
{
    protected string csv = string.Empty;
    protected string separator = ",";

    public CSVHelper(string csv, string separator = ",")
    {
        this.csv = csv;
        this.separator = separator;

        foreach (string line in Regex.Split(csv, "\n").ToList().Where(s => !string.IsNullOrEmpty(s)))
        {
            string[] values = Regex.Split(line, separator);

            for (int i = 0; i < values.Length; i++)
            {
                //Trim values
                values[i] = values[i].Trim('\"');
            }

            this.Add(values);
        }
    }

    public static string Load(string path)
    {
        return File.ReadAllText(path);
    }
}

/// <summary>
/// Loads File from path
/// </summary>
public static class CSVReader
{

    public static List<Event> Read(string file)
    {
        string fullpath = Application.streamingAssetsPath + file;

        var csv = new CSVHelper(CSVHelper.Load(fullpath), "\t");

        List<Event> data = new List<Event>();
        string[] header = csv[0];
        foreach (string[] line in csv)
        {
            if (line == header) continue;
            var d = new Event();

            for (int i = 0; i < header.Length; i++)
            {
                d.values.Add(header[i], line[i + 1]); //i+1 because the data has an extra column that we're craftily ignoring hehe
            }

            data.Add(d);
        }

        return data;
    }
}
