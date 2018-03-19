using System;
using System.Collections;
using System.Collections.Generic;
using UnityEngine;

public class GlobeRender : MonoBehaviour {

    
    List<Event> data;
    List<Point> points;
    List<GameObject> pointObjects;

    bool updateQueued;
    string filename = "/D3Vis/data/terrorism_small.tsv";
    //string filename = "/D3Vis/data/terrorism.tsv";


	// Use this for initialization
	void Start ()
    {
        data = CSVReader.Read(filename);
        points = new List<Point>();
        pointObjects = new List<GameObject>();
        updateQueued = true;

        AddPoints(data, "country_txt", "count", (e) => { return true; });
	}
	
	// Update is called once per frame
	void Update () {
        if (updateQueued)
        {
            pointObjects.Clear();

            foreach (var p in points)
            {
                GameObject obj = GameObject.CreatePrimitive(PrimitiveType.Cube);

                obj.name = p.Aggregate;
                obj.transform.SetParent(this.transform, false);
                obj.transform.localScale = new Vector3(p.Size, p.Size, p.Size * 4);
                obj.GetComponent<MeshRenderer>().material.color = p.Color;

                Vector3 position = new Vector3
                {
                    z = 0f,//Mathf.Sin(p.Position.y),
                    x = Mathf.Sin(p.Position.x),// * Mathf.Cos(p.Position.y),
                    y = Mathf.Cos(p.Position.x) //* Mathf.Cos(p.Position.y)
                };
                position *= 0.01f;
                obj.transform.localPosition = position;
                obj.transform.LookAt(2 * obj.transform.position - transform.position);
                

                pointObjects.Add(obj);
            }
            updateQueued = false;
        }
	}

    public void AddPoints(List<Event> d, string aggregate, string heightColumn, Func<Event, bool> filter, bool append = false)
    {
        if (!append)
        {
            points.Clear();
        }
        foreach (Event e in d)
        {
            if (filter(e))
            {
                int i = points.FindIndex(p => p.Aggregate == e.values[aggregate]);
                if (i < 0) 
                {
                    //new point
                    points.Add(new Point
                    {
                        EventID = new List<string> { e.values["eventid"] },
                        Aggregate = e.values[aggregate],
                        Position = new Vector2(float.Parse(e.values["longitude"]), float.Parse(e.values["latitude"])),
                        Color = Color.gray,
                        Size = 0.001f,
                        Height = heightColumn == "count" ? 1 : float.Parse(e.values[heightColumn])
                    });
                }
                else
                {
                    //add to ith point
                    points[i].EventID.Add(e.values["eventid"]);
                    points[i].Position += new Vector2(float.Parse(e.values["longitude"]), float.Parse(e.values["latitude"]));
                    points[i].Height += heightColumn == "count" ? 1 : float.Parse(e.values[heightColumn]);
                }
            }
        }
        //calc avg height and position
        float maxHeight = 0;
        foreach (Point p in points)
        {
            p.Position /= p.EventID.Count;
            p.Height /= p.EventID.Count;
            maxHeight = p.Height > maxHeight ? p.Height : maxHeight;
        }
        //normalize height to 1;
        foreach (Point p in points)
        {
            p.Height /= maxHeight;
        }
        updateQueued = true;
    }
        
    public void ClearPoints()
    {
        points.Clear();
        updateQueued = true;
    }
    
}

public class Point
{
    public List<string> EventID { get; set; }
    public string Aggregate { get; set; }
    public Vector2 Position { get; set; }
    public Color Color { get; set; }
    public float Size { get; set; }
    public float Height { get; set; }
}