using System;
using System.Collections;
using System.Collections.Generic;
using UnityEngine;

public class GlobeRender : MonoBehaviour {

    public Gradient gradient;
    public Material material;
    public GameObject DataElementPrefab;
    public bool animating;

    List<Event> data;
    List<Point> points;
    List<GameObject> pointObjects;

    Transform mapWall;
    Transform mapTable;

    bool pointsChanged;
    bool cleanupTrails;
    string filename = "/D3Vis/data/terrorism_small.tsv";
    //string filename = "/D3Vis/data/terrorism.tsv";

    const float rad = Mathf.PI / 180;

    int animFrames = 120;
    int animIndex = 0;

    // Use this for initialization
    void Start ()
    {
        mapWall = GameObject.FindGameObjectWithTag("MapWall").transform;
        mapTable = GameObject.FindGameObjectWithTag("MapTable").transform;
        data = CSVReader.Read(filename);
        points = new List<Point>();
        pointObjects = new List<GameObject>();
        pointsChanged = true;
        animating = false;
        cleanupTrails = false;

        
        //AddPoints("country_txt", "nkill", "count", 0.004f, (e) => { return true; });

        //animating = true;
	}
	
	// Update is called once per frame
	void Update () {
        if (pointsChanged)
        {
            pointObjects.Clear();

            foreach (var p in points)
            {
                var obj = Instantiate(DataElementPrefab);

                obj.name = p.Aggregate;
                obj.transform.SetParent(this.transform, false);
                obj.transform.localScale = new Vector3(p.Size, p.Size, p.Height);
                obj.GetComponent<MeshRenderer>().material.color = p.Color;
                
                var startPos = new Vector3
                {
                    x = p.Position.x / Mathf.PI * 0.4f - 0.01f,
                    y = p.Position.y / Mathf.PI * 0.7f - 0.09f,
                    z = 0f
                };
                startPos.Scale(mapWall.localScale);
                startPos += mapWall.position;
                
                p.WallPosition = startPos;

                pointObjects.Add(obj);
            }
            pointsChanged = false;
        }
        if (animating)
        {
            int start = Mathf.Max(0, animIndex - animFrames);
            int stop = Mathf.Min(animIndex, pointObjects.Count);
            for (int i = start; i < stop; i++)
            {
                if (animIndex == i + 1)
                {
                    pointObjects[i].GetComponent<TrailRenderer>().enabled = true;
                }

                pointObjects[i].transform.position = Vector3.Lerp(points[i].WallPosition, transform.TransformPoint(points[i].GlobePosition), (animIndex-i)/(float)animFrames);
                pointObjects[i].transform.LookAt(transform);
            }

            animIndex++;
            if(animIndex > pointObjects.Count + animFrames)
            {
                animating = false;
                cleanupTrails = true;
                animIndex = 0;
            }
        }
        if (!animating && cleanupTrails)
        {
            animIndex++;
            
            if (animIndex >= DataElementPrefab.GetComponent<TrailRenderer>().time * 100)
            {
                foreach (GameObject p in pointObjects)
                {
                    p.GetComponent<TrailRenderer>().enabled = false;
                }
                animIndex = 0;
                cleanupTrails = false;
            }
        }
	}

    public void AddPoints(string aggregate, string heightColumn, string colorColumn, float height, Func<Event, bool> filter, bool append = false)
    {
        if (!append)
        {
            points.Clear();
        }
        foreach (Event e in data)
        {
            if (filter(e))
            {
                if (float.Parse(e.values["latitude"]) == 0 && float.Parse(e.values["longitude"]) == 0) continue;

                int i = points.FindIndex(p => p.Aggregate == e.values[aggregate]);
                if (i < 0) 
                {
                    //new point
                    points.Add(new Point
                    {
                        EventID = new List<string> { e.values["eventid"] },
                        Aggregate = e.values[aggregate],
                        Position = new Vector2(float.Parse(e.values["longitude"]), float.Parse(e.values["latitude"])),
                        Color = gradient.Evaluate(0f),
                        Size = 0.00025f,
                        Height = heightColumn == "count" ? 1 : float.Parse(e.values[heightColumn]),
                        TColor = colorColumn == "count" ? 1 : float.Parse(e.values[colorColumn]),
                        TAnim = 0f,
                    });
                }
                else
                {
                    //add to ith point
                    points[i].EventID.Add(e.values["eventid"]);
                    points[i].Position += new Vector2(float.Parse(e.values["longitude"]), float.Parse(e.values["latitude"]));
                    points[i].Height += heightColumn == "count" ? 1 : float.Parse(e.values[heightColumn]);
                    points[i].TColor += colorColumn == "count" ? 1 : float.Parse(e.values[colorColumn]);
                }
            }
        }
        //calc avg height and position & convert to radians
        float maxHeight = 0;
        float maxTColor = 0;
        foreach (Point p in points)
        {
            p.Position /= p.EventID.Count;
            p.Position *= rad;
            p.GlobePosition = new Vector3
            {
                x = -Mathf.Sin(p.Position.x) * Mathf.Cos(p.Position.y) * 0.01f,
                y = -Mathf.Cos(p.Position.x) * Mathf.Cos(p.Position.y) * 0.01f,
                z = Mathf.Sin(p.Position.y) * 0.01f
            };
            maxHeight = p.Height > maxHeight ? p.Height : maxHeight;
            maxTColor = p.TColor > maxTColor ? p.TColor : maxTColor;
        }
        //normalize height to 1;
        foreach (Point p in points)
        {
            p.Height = p.Height * height / maxHeight;
            if (p.Height < 0.00005f) p.Height = 0.00005f;
            p.TColor /= maxTColor;
            p.Color = gradient.Evaluate(p.TColor);
        }
        pointsChanged = true;
    }
        
    public void ClearPoints()
    {
        points.Clear();
        pointsChanged = true;
    }
    
    
}

public class Point
{
    public List<string> EventID { get; set; }
    public string Aggregate { get; set; }
    public Vector2 Position { get; set; }
    public Vector3 GlobePosition { get; set; }
    public Vector3 WallPosition { get; set; }
    public Vector3 TablePosition { get; set; }
    public Color Color { get; set; }
    public float Size { get; set; }
    public float Height { get; set; }
    public float TColor { get; set; }
    public float TAnim { get; set; }
}